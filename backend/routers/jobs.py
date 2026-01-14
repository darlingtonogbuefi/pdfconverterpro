# backend/routers/jobs.py
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

# This dict tracks all jobs
# key: job_id, value: dict with status + S3 key + error
JOB_STORE = {}

@router.get("/{job_id}")
async def get_job_status(job_id: str):
    job = JOB_STORE.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job["status"] == "success":
        return {
            "status": "success",
            "result_url": job.get("result_url")
        }
    elif job["status"] == "failed":
        return {
            "status": "failed",
            "error": job.get("error", "Conversion failed")
        }
    else:
        return {"status": "pending"}
