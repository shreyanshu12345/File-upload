import boto3
import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

R2_ENDPOINT        = os.getenv("R2_ENDPOINT")
R2_ACCESS_KEY_ID   = os.getenv("R2_ACCESS_KEY_ID")
R2_SECRET_ACCESS_KEY = os.getenv("R2_SECRET_ACCESS_KEY")
R2_BUCKET          = os.getenv("R2_BUCKET")
MONGO_URI          = os.getenv(
    "MONGO_URI",
)

s3 = boto3.client(
    "s3",
    endpoint_url=R2_ENDPOINT,
    aws_access_key_id=R2_ACCESS_KEY_ID,
    aws_secret_access_key=R2_SECRET_ACCESS_KEY,
    region_name="auto",
)

mongo_client = MongoClient(MONGO_URI)
mappings = mongo_client["uploadedfile"]["mappings"]


def run_cleanup():
    now = datetime.now(timezone.utc)
    expired = list(mappings.find({"expires_at": {"$lt": now}}))

    if not expired:
        print(f"[{now.isoformat()}] No expired files.")
        return

    for doc in expired:
        key  = doc.get("key")
        code = doc.get("code")
        try:
            s3.delete_object(Bucket=R2_BUCKET, Key=key)
            mappings.delete_one({"_id": doc["_id"]})
            print(f"[{now.isoformat()}] Deleted: {key} (code={code})")
        except Exception as e:
            print(f"[{now.isoformat()}] Failed to delete {key}: {e}")

    print(f"[{now.isoformat()}] Cleanup done — {len(expired)} file(s) removed.")


if __name__ == "__main__":
    run_cleanup()
