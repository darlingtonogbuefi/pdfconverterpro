# backend/utils/s3_utils.py

import boto3
import tempfile
from backend.core.config import AWS_REGION, JOBS__FILES_S3_BUCKET

s3 = boto3.client("s3", region_name=AWS_REGION)

# Rename this function to match the import
def upload_file_to_s3(local_path: str, s3_key: str):
    s3.upload_file(local_path, JOBS__FILES_S3_BUCKET, s3_key)

def download_file(s3_key: str) -> str:
    tmp = tempfile.NamedTemporaryFile(delete=False)
    s3.download_fileobj(JOBS__FILES_S3_BUCKET, s3_key, tmp)
    return tmp.name

