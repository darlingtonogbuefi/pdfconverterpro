# backend\worker.py

# backend\worker.py

import logging
import boto3
import json
from backend.services.pdf_to_powerpoint import convert_pdf_to_ppt
from backend.utils.s3_utils import download_file, upload_file_to_s3
from backend.core.config import AWS_REGION, SQS_QUEUE_URL
import os
import tempfile
import time

# --------------------------
# SETUP FULL LOGGING
# --------------------------
logger = logging.getLogger("pdf_worker")
logger.setLevel(logging.DEBUG)  # log everything

formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

# Stream to console
console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# Optional: also log to file
file_handler = logging.FileHandler("pdf_worker_full.log")
file_handler.setFormatter(formatter)
logger.addHandler(file_handler)

logger.info("Starting PDF Converter Worker")

# --------------------------
# CONNECT TO SQS
# --------------------------
sqs = boto3.client("sqs", region_name=AWS_REGION)
logger.info(f"Connected to SQS queue: {SQS_QUEUE_URL}")

# --------------------------
# MAIN WORKER LOOP
# --------------------------
while True:
    try:
        resp = sqs.receive_message(
            QueueUrl=SQS_QUEUE_URL,
            WaitTimeSeconds=20,
            MaxNumberOfMessages=1
        )

        if "Messages" not in resp:
            continue

        msg = resp["Messages"][0]
        body = json.loads(msg["Body"])
        job_id = body.get("job_id", "unknown")
        input_s3_key = body.get("input_s3_key", "unknown")

        logger.info(f"Processing job {job_id} for file {input_s3_key}")

        input_path = None
        output_path = None

        try:
            # Download PDF from S3
            input_path = download_file(input_s3_key)
            logger.debug(f"Downloaded PDF to {input_path}")

            # Create temporary output PPTX file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as tmp_out:
                output_path = tmp_out.name
            logger.debug(f"Temporary output file: {output_path}")

            # Convert PDF to PPT
            original_name = os.path.basename(input_s3_key)
            convert_pdf_to_ppt(input_path, output_path, original_name)
            logger.info(f"Conversion successful for job {job_id}")

            # Upload result to S3
            upload_file_to_s3(output_path, f"outputs/{job_id}/result.pptx")
            logger.info(f"Uploaded converted PPTX for job {job_id}")

        except Exception as e:
            logger.exception(f"Conversion failed for job {job_id}: {e}")

        finally:
            # Clean up temp files
            if input_path and os.path.exists(input_path):
                os.remove(input_path)
            if output_path and os.path.exists(output_path):
                os.remove(output_path)

        # Delete message from SQS
        try:
            sqs.delete_message(
                QueueUrl=SQS_QUEUE_URL,
                ReceiptHandle=msg["ReceiptHandle"]
            )
            logger.debug(f"Deleted message for job {job_id} from SQS")
        except Exception as e:
            logger.exception(f"Failed to delete SQS message for job {job_id}: {e}")

    except Exception as e:
        logger.exception(f"Worker loop exception: {e}")
        time.sleep(5)
