# backend/utils/sqs_client.py

import boto3
import json
from backend.core.config import AWS_REGION, SQS_QUEUE_URL

sqs = boto3.client("sqs", region_name=AWS_REGION)

def send_job(job: dict, delay_seconds: int = 0):
    """
    Send a job to the SQS queue.
    
    Args:
        job (dict): Job payload to send.
        delay_seconds (int): Optional delay before the message becomes visible.
    """
    sqs.send_message(
        QueueUrl=SQS_QUEUE_URL,
        MessageBody=json.dumps(job),
        DelaySeconds=delay_seconds
    )
