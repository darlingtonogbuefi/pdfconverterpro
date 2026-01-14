# backend\worker.py

import logging
import boto3
import json
import requests
from backend.services.pdf_to_powerpoint import convert_pdf_to_ppt
from backend.utils.s3_utils import download_file, upload_file_to_s3
from backend.core.config import AWS_REGION, SQS_QUEUE_URL, FRONTEND_SQS_QUEUE_URL, VITE_BACKEND_URL
import os
import time
import shutil
import tempfile

# --------------------------
# SETUP FULL LOGGING
# --------------------------
logger = logging.getLogger("pdf_worker")
logger.setLevel(logging.DEBUG)

formatter = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")

console_handler = logging.StreamHandler()
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

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
# S3 CLIENT AND BUCKET CONFIG
# --------------------------
s3 = boto3.client("s3")
JOBS__FILES_S3_BUCKET = "pdfconvertpro-files-prod"

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
        enable_ocr = body.get("enable_ocr", False)

        logger.info(f"Processing job {job_id} for file {input_s3_key}, OCR={enable_ocr}")

        input_path = None
        job_dir = None
        output_path = None

        try:
            # --------------------------
            # CREATE JOB TEMP DIRECTORY
            # --------------------------
            job_dir = tempfile.mkdtemp(prefix=f"job_{job_id}_")

            # --------------------------
            # DOWNLOAD PDF
            # --------------------------
            input_path = download_file(input_s3_key)
            logger.debug(f"Downloaded PDF to {input_path}")

            # --------------------------
            # DEFINE OUTPUT FILE PATH
            # --------------------------
            output_path = os.path.join(job_dir, "result.pptx")
            logger.debug(f"Job output file: {output_path}")

            # --------------------------
            # CONVERT PDF TO PPT
            # --------------------------
            original_name = os.path.basename(input_s3_key)
            convert_pdf_to_ppt(input_path, output_path, original_name, enable_ocr=enable_ocr)

            # --------------------------
            # VALIDATE OUTPUT FILE
            # --------------------------
            if not os.path.exists(output_path):
                raise RuntimeError("PPTX file was not created")

            pptx_size = os.path.getsize(output_path)
            logger.info(f"PPTX size before upload: {pptx_size} bytes")

            if pptx_size == 0:
                raise RuntimeError("PPTX file is empty")

            logger.info(f"Conversion successful for job {job_id}")

            # --------------------------
            # UPLOAD TO FILES BUCKET
            # --------------------------
            s3_key = f"outputs/{job_id}/result.pptx"
            upload_file_to_s3(output_path, s3_key)
            logger.info(f"Uploaded converted PPTX for job {job_id} to s3://{JOBS__FILES_S3_BUCKET}/{s3_key}")

            # --------------------------
            # GENERATE PRESIGNED URL
            # --------------------------
            presigned_url = s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": JOBS__FILES_S3_BUCKET, "Key": s3_key},
                ExpiresIn=3600
            )
            logger.info(f"Presigned URL for job {job_id}: {presigned_url}")

            # --------------------------
            # UPDATE BACKEND JOB STORE
            # --------------------------
            try:
                requests.post(
                    f"{VITE_BACKEND_URL}/api/jobs/{job_id}/update",
                    json={"status": "success", "result_url": presigned_url},
                    timeout=10
                )
                logger.debug(f"Updated backend JOB_STORE for job {job_id}")
            except Exception as e:
                logger.warning(f"Failed to update backend JOB_STORE for job {job_id}: {e}")

            # --------------------------
            # SEND STATUS TO FRONTEND SQS
            # --------------------------
            if FRONTEND_SQS_QUEUE_URL:
                job_status = {"job_id": job_id, "status": "success", "result_url": presigned_url}
                sqs.send_message(
                    QueueUrl=FRONTEND_SQS_QUEUE_URL,
                    MessageBody=json.dumps(job_status)
                )
                logger.debug(f"Sent job status to frontend SQS for job {job_id}")

        except Exception as e:
            logger.exception(f"Conversion failed for job {job_id}: {e}")
            # Update backend JOB_STORE on failure
            try:
                requests.post(
                    f"{VITE_BACKEND_URL}/api/jobs/{job_id}/update",
                    json={"status": "failed", "error": str(e)},
                    timeout=10
                )
            except:
                pass

        finally:
            # --------------------------
            # CLEANUP TEMP FILES
            # --------------------------
            try:
                if input_path and os.path.exists(input_path):
                    os.remove(input_path)
                if job_dir and os.path.exists(job_dir):
                    shutil.rmtree(job_dir)
            except Exception as cleanup_err:
                logger.warning(f"Cleanup failed for job {job_id}: {cleanup_err}")

        # --------------------------
        # DELETE MESSAGE FROM SQS
        # --------------------------
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
