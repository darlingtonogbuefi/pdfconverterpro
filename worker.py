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
# STARTUP LOGGING
# --------------------------
startup_logger = logging.getLogger("startup")
startup_logger.setLevel(logging.INFO)
startup_handler = logging.StreamHandler()
startup_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
startup_logger.addHandler(startup_handler)

startup_logger.info("Starting PDF Converter Worker")

# Connect to SQS
sqs = boto3.client("sqs", region_name=AWS_REGION)
startup_logger.info(f"Connected to SQS queue: {SQS_QUEUE_URL}")

# --------------------------
# LOOP LOGGING (minimal)
# --------------------------
loop_logger = logging.getLogger("worker_loop")
loop_logger.setLevel(logging.WARNING)  # only warnings and errors inside loop
loop_handler = logging.StreamHandler()
loop_handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(message)s"))
loop_logger.addHandler(loop_handler)

# --------------------------
# MAIN LOOP
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

        # Only log if something unusual happens
        try:
            input_path = download_file(input_s3_key)
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pptx") as tmp_out:
                output_path = tmp_out.name
            convert_pdf_to_ppt(input_path, output_path)
            upload_file_to_s3(output_path, f"outputs/{job_id}/result.pptx")
        finally:
            if os.path.exists(input_path):
                os.remove(input_path)
            if os.path.exists(output_path):
                os.remove(output_path)

        sqs.delete_message(
            QueueUrl=SQS_QUEUE_URL,
            ReceiptHandle=msg["ReceiptHandle"]
        )

    except Exception as e:
        # Only log exceptions, not every loop iteration
        loop_logger.exception(f"Worker exception: {e}")
        time.sleep(5)  # avoid tight crash loop
