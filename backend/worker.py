# worker.py (relative to C:\DevOps-Projects\converter_lovable\worker.py) 
# C:\DevOps-Projects\converter_lovable\worker.py

import boto3
import json
from backend.services.pdf_to_powerpoint import convert_pdf_to_ppt
from backend.utils.s3_utils import download_file, upload_file_to_s3
from backend.core.config import AWS_REGION, SQS_QUEUE_URL
import os
import tempfile
import logging

# --------------------------
# SETUP LOGGING
# --------------------------
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s'
)
logging.info("Starting PDF Converter Worker")

# --------------------------
# CONNECT TO SQS
# --------------------------
sqs = boto3.client("sqs", region_name=AWS_REGION)
logging.info(f"Connected to SQS queue: {SQS_QUEUE_URL}")

# --------------------------
# MAIN LOOP
# --------------------------
while True:
    try:
        logging.info("Polling SQS for messages...")
        resp = sqs.receive_message(
            QueueUrl=SQS_QUEUE_URL,
            WaitTimeSeconds=20,
            MaxNumberOfMessages=1
        )
        logging.info(f"Receive response: {resp}")

        if "Messages" not in resp:
            continue

        msg = resp["Messages"][0]
        body = json.loads(msg["Body"])
        job_id = body.get("job_id", "unknown")
        input_s3_key = body.get("input_s3_key", "unknown")
        logging.info(f"Processing job {job_id} with input {input_s3_key}")

        # Download input PDF to a temporary file
        input_path = download_file(input_s3_key)
        logging.info(f"Downloaded PDF to {input_path}")

        # Prepare a temporary output file for PPTX
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as tmp_out:
            output_path = tmp_out.name
        logging.info(f"Temporary PPTX output path: {output_path}")

        try:
            # Convert PDF → PowerPoint
            logging.info("Starting PDF → PPT conversion...")
            convert_pdf_to_ppt(input_path, output_path)
            logging.info("PDF → PPT conversion complete")

            # Upload result PPTX to S3
            upload_file_to_s3(output_path, f"outputs/{job_id}/result.pptx")
            logging.info(f"Uploaded PPTX to S3: outputs/{job_id}/result.pptx")

        finally:
            # Cleanup temporary files
            if os.path.exists(input_path):
                os.remove(input_path)
                logging.info(f"Deleted temporary input file: {input_path}")
            if os.path.exists(output_path):
                os.remove(output_path)
                logging.info(f"Deleted temporary output file: {output_path}")

        # Delete the SQS message after successful processing
        sqs.delete_message(
            QueueUrl=SQS_QUEUE_URL,
            ReceiptHandle=msg["ReceiptHandle"]
        )
        logging.info(f"Deleted message from SQS: {msg['ReceiptHandle']}")

    except Exception as e:
        logging.exception(f"Exception occurred in worker loop: {e}")
