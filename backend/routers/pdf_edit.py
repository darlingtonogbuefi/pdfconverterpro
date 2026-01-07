# backend/routers/pdf_edit.py

from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import JSONResponse
from ..services.pdf_edit import get_pdf_text, update_pdf_text
from typing import List
import tempfile
import json
import shutil
import os

router = APIRouter(prefix="/pdf-edit", tags=["PDF Edit"])

@router.post("/extract")
async def extract_text(file: UploadFile = File(...)):
    """
    Extract text from the uploaded PDF file.
    """
    # Use a temporary file safely
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
        tmp_path = tmp_file.name
        tmp_file.write(await file.read())

    try:
        # Call service to extract text blocks
        pages = get_pdf_text(tmp_path)
        return {"pages": pages}
    finally:
        # Cleanup temporary file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


@router.post("/update")
async def update_text(
    file: UploadFile = File(...),
    updates: str = Form(...),  # Receive JSON string from frontend form
):
    """
    Apply text updates to the uploaded PDF.

    updates: JSON string list of updates, each with text and bbox info.
    """
    # Temporary input and output files
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_input_file:
        tmp_input_path = tmp_input_file.name
        tmp_input_file.write(await file.read())

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_output_file:
        tmp_output_path = tmp_output_file.name

    try:
        # Parse updates JSON safely
        try:
            updates_list = json.loads(updates)
        except json.JSONDecodeError:
            updates_list = []

        # Apply updates via service
        update_pdf_text(tmp_input_path, updates_list, tmp_output_path)

        # Return path or URL for frontend
        return JSONResponse({"file_path": tmp_output_path})
    finally:
        # Cleanup input file
        if os.path.exists(tmp_input_path):
            os.remove(tmp_input_path)
