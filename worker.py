# worker.py (relative to C:\DevOps-Projects\converter_lovable\worker.py)
# C:\DevOps-Projects\converter_lovable\worker.py

import boto3
import json
from backend.services.pdf_to_powerpoint import convert_pdf_to_ppt
from backend.utils.s3_utils import download_file, upload_file
from backend.core.config import AWS_REGION, SQS_QUEUE_URL
import os
import tempfile

sqs = boto3.client("sqs", region_name=AWS_REGION)

while True:
    resp = sqs.receive_message(
        QueueUrl=SQS_QUEUE_URL,
        WaitTimeSeconds=20,
        MaxNumberOfMessages=1
    )

    if "Messages" not in resp:
        continue

    msg = resp["Messages"][0]
    body = json.loads(msg["Body"])

    # Download input PDF to a temporary file
    input_path = download_file(body["input_s3_key"])

    # Prepare a temporary output file for PPTX
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as tmp_out:
        output_path = tmp_out.name

    try:
        # Convert PDF → PowerPoint
        convert_pdf_to_ppt(input_path, output_path)

        # Upload result PPTX to S3
        upload_file(output_path, f"outputs/{body['job_id']}/result.pptx")

    finally:
        # Cleanup temporary files
        if os.path.exists(input_path):
            os.remove(input_path)
        if os.path.exists(output_path):
            os.remove(output_path)

    # Delete the SQS message after successful processing
    sqs.delete_message(
        QueueUrl=SQS_QUEUE_URL,
        ReceiptHandle=msg["ReceiptHandle"]
    )
