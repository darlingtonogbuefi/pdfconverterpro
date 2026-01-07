# backend\routers\office.py

import os
import tempfile
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, UploadFile, File, HTTPException

from backend.services.word_to_pdf import convert_word_to_pdf
from backend.services.pdf_to_word import convert_pdf_to_word
from backend.services.word_to_excel import convert_word_to_excel
from backend.services.pdf_to_excel import convert_pdf_to_excel

from backend.utils.file_utils import encode_file_to_base64
from backend.utils.sqs_client import send_job
from backend.utils.s3_utils import upload_file_to_s3

router = APIRouter(prefix="/api/convert", tags=["Office"])

# ----------------------
# Word → PDF (SYNC)
# ----------------------
@router.post("/word-to-pdf")
async def word_to_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith((".doc", ".docx")):
        raise HTTPException(status_code=400, detail="Word file required")

    with tempfile.TemporaryDirectory() as tmp:
        docx_path = os.path.join(tmp, "in.docx")
        pdf_path = os.path.join(tmp, "out.pdf")

        with open(docx_path, "wb") as f:
            f.write(await file.read())

        convert_word_to_pdf(docx_path, pdf_path, file.filename)

        return {
            "filename": os.path.basename(pdf_path),
            "file": encode_file_to_base64(pdf_path),
            "success": True
        }


# ----------------------
# PDF → Word (SYNC)
# ----------------------
@router.post("/pdf-to-word")
async def pdf_to_word(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "in.pdf")
        docx_path = os.path.join(tmp, "out.docx")

        with open(pdf_path, "wb") as f:
            f.write(await file.read())

        return convert_pdf_to_word(pdf_path, docx_path, file.filename)


# ----------------------
# Word → Excel (SYNC)
# ----------------------
@router.post("/word-to-excel")
async def word_to_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".doc", ".docx")):
        raise HTTPException(status_code=400, detail="Word file required")

    with tempfile.TemporaryDirectory() as tmp:
        docx_path = os.path.join(tmp, "in.docx")
        output_filename = Path(file.filename).stem + ".xlsx"
        excel_path = os.path.join(tmp, output_filename)

        with open(docx_path, "wb") as f:
            f.write(await file.read())

        convert_word_to_excel(docx_path, excel_path, file.filename)

        return {
            "filename": output_filename,
            "file": encode_file_to_base64(excel_path),
            "success": True
        }


# ----------------------
# PDF → PowerPoint (ASYNC via SQS) ✅
# ----------------------
@router.post("/pdf-to-powerpoint")
async def pdf_to_powerpoint(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")

    job_id = str(uuid.uuid4())

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "input.pdf")

        with open(pdf_path, "wb") as f:
            f.write(await file.read())

        # Upload input PDF to S3
        input_s3_key = f"jobs/{job_id}/input.pdf"
        upload_file_to_s3(pdf_path, input_s3_key)

    # Send job to SQS
    send_job({
        "job_id": job_id,
        "type": "pdf_to_powerpoint",
        "input_s3_key": input_s3_key,
        "original_filename": file.filename
    })

    # Immediate response (non-blocking)
    return {
        "job_id": job_id,
        "status": "queued"
    }


# ----------------------
# PDF → Excel (SYNC for now)
# ----------------------
@router.post("/pdf-to-excel")
async def pdf_to_excel(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="PDF file required")

    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = os.path.join(tmp, "in.pdf")
        excel_path = os.path.join(tmp, "out.xlsx")

        with open(pdf_path, "wb") as f:
            f.write(await file.read())

        try:
            result = convert_pdf_to_excel(pdf_path, excel_path, file.filename)
        except Exception as e:
            logging.exception("PDF → Excel conversion failed")
            return {"success": False, "error": str(e)}

        return result
