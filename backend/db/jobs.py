# backend/db/jobs.py

from sqlalchemy.orm import Session
from backend.db.models import Job

def create_job(
    db: Session,
    job_id: str,
    status: str,
    input_s3_key: str
):
    job = Job(
        job_id=job_id,
        status=status,
        input_s3_key=input_s3_key
    )
    db.add(job)
    db.commit()

def update_job(
    db: Session,
    job_id: str,
    status: str,
    output_s3_key: str | None = None,
    error: str | None = None
):
    job = db.query(Job).filter(Job.job_id == job_id).first()
    if not job:
        return

    job.status = status
    if output_s3_key:
        job.output_s3_key = output_s3_key
    if error:
        job.error_message = error

    db.commit()
