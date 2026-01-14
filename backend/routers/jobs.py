# backend/routers/jobs.py


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/jobs", tags=["Jobs"])

# This dict tracks all jobs
# key: job_id, value: dict with status + S3 key + error
JOB_STORE = {}

class JobUpdate(BaseModel):
    status: str
    result_url: str | None = None
    error: str | None = None

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

@router.post("/{job_id}/update")
async def update_job_status(job_id: str, update: JobUpdate):
    if job_id not in JOB_STORE:
        # Initialize if not exist
        JOB_STORE[job_id] = {"status": "pending"}

    JOB_STORE[job_id]["status"] = update.status
    if update.result_url:
        JOB_STORE[job_id]["result_url"] = update.result_url
    if update.error:
        JOB_STORE[job_id]["error"] = update.error

    return {"success": True}
