

import os
from dotenv import load_dotenv
import json
from botocore.client import Config
from botocore.exceptions import ClientError

import boto3
from dataplane import s3_upload



load_dotenv()

R2_ENDPOINT= os.getenv('R2_ENDPOINT')
R2_ACCESS_KEY_ID=  os.getenv('R2_ACCESS_KEY_ID') 
R2_SECRET_ACCESS_KEY=os.getenv('R2_SECRET_ACCESS_KEY')
R2_BUCKET=os.getenv('R2_BUCKET')



class R2Functions:
    def __init__(self):
        self.R2_connect = boto3.client(
            's3',
            endpoint_url=R2_ENDPOINT,
            aws_access_key_id=R2_ACCESS_KEY_ID,
            aws_secret_access_key=R2_SECRET_ACCESS_KEY,
            region_name="auto",  
            config=Config(signature_version='s3v4'),
            )

    def initialise_multipart_upload(self, key):
        try:
            id = self.R2_connect.create_multipart_upload(Bucket=R2_BUCKET, Key=key)['UploadId']
            return id
        except:
            print('couldnt create a session')

    def generate_presigned_part_url(self, key, upload_id, part_number):
        try:
            url = self.R2_connect.generate_presigned_url(
                ClientMethod='upload_part',
                Params={
                    'Bucket': R2_BUCKET,
                    'Key': key,
                    'UploadId': upload_id,
                    'PartNumber': part_number
                },
                ExpiresIn=3600
            )
            return url
        except Exception as e:
            print("error generating presigned url:", e)
            return None



# S3Connect = boto3.client(
#     's3',
#     endpoint_url=R2_ENDPOINT,
#     aws_access_key_id=R2_ACCESS_KEY_ID,
#     aws_secret_access_key=R2_SECRET_ACCESS_KEY,
#     region_name="auto",  # ✅ FIX
#     config=Config(signature_version='s3v4'),
# )

# def upload_file(file_name, bucket_name, object_name=None):
#     if object_name is None:
#         object_name = "files/" + file_name
 
#     try:
#         S3Connect.upload_file(file_name, bucket_name, object_name)
#     except ClientError as e:
#         print(f"An error occurred: {e}")
#         return False
#     return True

# if upload_file("dummy.txt", R2_BUCKET):
#     print(f"File  uploaded successfully to ")
# else:
#     print(f"File upload failed")