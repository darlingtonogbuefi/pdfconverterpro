# backend/utils/s3_utils.py

import boto3
import tempfile
from backend.core.config import AWS_REGION, S3_BUCKET_NAME

s3 = boto3.client("s3", region_name=AWS_REGION)

# Rename this function to match the import
def upload_file_to_s3(local_path: str, s3_key: str):
    s3.upload_file(local_path, S3_BUCKET_NAME, s3_key)

def download_file(s3_key: str) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False)
    s3.download_fileobj(S3_BUCKET_NAME, s3_key, tmp)
    return tmp.name

