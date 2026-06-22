

from flask import Flask, request, jsonify
import os
import uuid
import secrets
import string
import math
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
import helper
from flask_cors import CORS
from pymongo import MongoClient

load_dotenv(override=True)

app = Flask(__name__)
CORS(app)

obj = helper.R2Functions()
R2_BUCKET = os.getenv('R2_BUCKET')
CHUNK_SIZE = 5 * 1024 * 1024  # must match frontend constant

# ── MongoDB ───────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI")
print(f"[startup] MONGO_URI = {MONGO_URI[:30]}..." if MONGO_URI else "[startup] MONGO_URI is NOT SET — will use localhost:27017")
mongo_client = MongoClient(MONGO_URI)
db           = mongo_client["uploadedfile"]
mappings     = db["mappings"]


# ── Helpers ───────────────────────────────────────────────────────────────────

def generate_code(length=6):
    """Random uppercase alphanumeric code, e.g. 'A3X9KZ'."""
    alphabet = string.ascii_uppercase + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def unique_code():
    """Code guaranteed not to already exist in the collection."""
    while True:
        code = generate_code()
        if not mappings.find_one({"code": code}):
            return code


def original_name_from_key(key: str) -> str:
    """
    Extract original filename from R2 key.
    Key format: 'files/<uuid36>-<original_name>'
    UUID v4 = 36 chars + '-' = 37 chars prefix after 'files/'.
    """
    stem = key.removeprefix("files/")
    return stem[37:] if len(stem) > 37 else stem


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/")
def home():
    return "Hello, Flask!"


@app.route("/start-upload", methods=["POST"])
def create_session():
    try:
        data = request.json
        if not data or "filename" not in data:
            return jsonify({"error": "filename is required"}), 400

        file_size = data.get("fileSize", 0)
        if file_size > 1024 ** 3:
            return jsonify({"error": "File exceeds the 1 GB size limit"}), 413

        original_name   = data["filename"]
        unique_filename = f"{uuid.uuid4()}-{original_name}"
        key             = "files/" + unique_filename

        upload_id = obj.initialise_multipart_upload(key)
        if not upload_id:
            return jsonify({"error": "Failed to create upload session"}), 500

        total_parts = math.ceil(file_size / CHUNK_SIZE) if file_size > 0 else 1
        presigned_urls = []
        for part_number in range(1, total_parts + 1):
            url = obj.generate_presigned_part_url(key, upload_id, part_number)
            if not url:
                return jsonify({"error": f"Failed to generate presigned URL for part {part_number}"}), 500
            presigned_urls.append({"partNumber": part_number, "url": url})

        return jsonify({
            "uploadId": upload_id,
            "key": key,
            "filename": unique_filename,
            "presignedUrls": presigned_urls,
        })

    except Exception as e:
        print(f"[start-upload] error: {e}")
        return jsonify({"error": str(e)}), 500



@app.route("/complete-upload", methods=["POST"])
def complete_upload():
    try:
        data = request.json
        if not data:
            return jsonify({"error": "No data provided"}), 400

        upload_id = data.get("uploadId")
        key       = data.get("key")
        parts     = data.get("parts")

        if not upload_id or not key or parts is None:
            return jsonify({"error": "uploadId, key, parts are required"}), 400

        formatted_parts = [
            {"PartNumber": int(p["PartNumber"]), "ETag": p["ETag"]}
            for p in parts
        ]
        formatted_parts.sort(key=lambda x: x["PartNumber"])

        obj.R2_connect.complete_multipart_upload(
            Bucket=R2_BUCKET,
            Key=key,
            UploadId=upload_id,
            MultipartUpload={"Parts": formatted_parts}
        )

        # ── Generate short code and persist mapping ───────────────────────
        code          = unique_code()
        original_name = original_name_from_key(key)

        expires_in_days = int(data.get("expiresInDays", 1))
        if expires_in_days not in (1, 3, 5):
            expires_in_days = 1
        uploaded_at = datetime.now(timezone.utc)

        mappings.insert_one({
            "code":              code,
            "key":               key,
            "original_filename": original_name,
            "uploaded_at":       uploaded_at,
            "expires_in_days":   expires_in_days,
            "expires_at":        uploaded_at + timedelta(days=expires_in_days),
        })

        return jsonify({"status": "completed", "code": code})

    except Exception as e:
        print(f"[complete-upload] error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/download-by-code", methods=["POST"])
def download_by_code():
    try:
        data = request.json
        if not data or "code" not in data:
            return jsonify({"error": "code is required"}), 400

        code    = data["code"].strip().upper()
        mapping = mappings.find_one({"code": code})

        if not mapping:
            return jsonify({"error": "Invalid code — no file found"}), 404

        original_name = mapping.get("original_filename", "file")
        url = obj.R2_connect.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": R2_BUCKET,
                "Key":    mapping["key"],
                "ResponseContentDisposition": f'attachment; filename="{original_name}"',
            },
            ExpiresIn=3600
        )

        return jsonify({"url": url, "filename": original_name})

    except Exception as e:
        print(f"[download-by-code] error: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
