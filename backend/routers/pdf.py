#  backend\routers\pdf.py

import base64
import os
import tempfile
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, Request, Form

from backend.core.limiter import limiter
from backend.schemas.common import FileResponse as ApiFileResponse, SplitPDFResponse
from backend.utils.file_utils import encode_file_to_base64
from backend.services.pdf_split import split_pdf_base64
from backend.services.pdf_merge import merge_pdfs
from backend.services.pdf_compress import compress_pdf
from backend.services.pdf_overlay import overlay_pdf
from backend.services.pdf_rotate import rotate_pdf
from backend.services.pdf_sign import sign_pdf
from fastapi import APIRouter, UploadFile, File, Form
from tempfile import NamedTemporaryFile
from backend.services.pdf_watermark import add_watermark_to_pdf

router = APIRouter(prefix="/api/convert", tags=["PDF"])

# ---------------------- PDF Split ----------------------
@router.post("/pdf-split", response_model=SplitPDFResponse)
@limiter.limit("10/minute")
async def pdf_split(
    request: Request,
    file: UploadFile = File(...),
    start: int = 1,
    end: int | None = None,
):
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / file.filename
        pdf_path.write_bytes(await file.read())
        return split_pdf_base64(str(pdf_path), tmp, start, end)

# ---------------------- PDF Merge ----------------------
@router.post("/pdf-merge")
@limiter.limit("10/minute")
async def pdf_merge(request: Request, files: List[UploadFile] = File(...)):
    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        for f in files:
            p = Path(tmp) / f.filename
            p.write_bytes(await f.read())
            paths.append(str(p))

        merged = Path(tmp) / "merged.pdf"
        merge_pdfs(paths, str(merged))

        return {
            "success": True,
            "filename": "merged.pdf",
            "file": encode_file_to_base64(str(merged)),
        }

# ---------------------- PDF Rotate ----------------------
@router.post("/pdf-rotate")
@limiter.limit("10/minute")
async def pdf_rotate_endpoint(
    request: Request,
    file: UploadFile = File(...),
    angle: int = 90,
):
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / "in.pdf"
        out_path = Path(tmp) / "rotated.pdf"

        pdf_path.write_bytes(await file.read())
        rotate_pdf(str(pdf_path), str(out_path), int(angle))

        return {
            "success": True,
            "filename": "rotated.pdf",
            "file": encode_file_to_base64(str(out_path)),
        }

# ... keep all your existing imports and helper functions ...

# ---------------------- PDF Sign (Nutrient) ----------------------
NUTRIENT_SIGN_URL = "https://api.nutrient.io/sign"
NUTRIENT_API_KEY = os.getenv("NUTRIENT_API_KEY")

@router.post("/pdf-sign")
@limiter.limit("10/minute")
async def pdf_sign_endpoint(
    request: Request,
    file: UploadFile = File(...),
    signatureType: str = Form("cades"),
    cadesLevel: str = Form("b-lt"),
):
    import requests, json

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_pdf:
        tmp_pdf.write(await file.read())
        pdf_path = tmp_pdf.name

    try:
        with open(pdf_path, "rb") as f:
            files = {"file": f}
            data = {"data": {"signatureType": signatureType, "cadesLevel": cadesLevel}}
            response = requests.post(
                NUTRIENT_SIGN_URL,
                headers={"Authorization": f"Bearer {NUTRIENT_API_KEY}"},
                files=files,
                data={"data": json.dumps(data["data"])},
                stream=True,
            )

        if not response.ok:
            return {"success": False, "error": response.text}

        out_path = Path(tempfile.gettempdir()) / f"signed_{file.filename}"
        with open(out_path, "wb") as f_out:
            for chunk in response.iter_content(chunk_size=8192):
                f_out.write(chunk)

        return {
            "success": True,
            "filename": f"signed_{file.filename}",
            "file": encode_file_to_base64(str(out_path)),
        }
    finally:
        if os.path.exists(pdf_path):
            os.remove(pdf_path)


# ---------------------- PDF Compress ----------------------
@router.post("/pdf-compress", response_model=ApiFileResponse)
@limiter.limit("10/minute")
async def pdf_compress(
    request: Request,
    file: UploadFile = File(...),
    select_pages: str = "",
    compression_level: str = "max",
    recompress_images: bool = True,
):
    with tempfile.TemporaryDirectory() as tmp:
        pdf_path = Path(tmp) / file.filename
        out_path = Path(tmp) / f"compressed_{file.filename}"

        pdf_path.write_bytes(await file.read())

        compressed_file, _ = compress_pdf(
            str(pdf_path),
            str(out_path),
            select_pages=select_pages,
            compression_level=compression_level,
            recompress_images=recompress_images,
        )

        return {
            "success": True,
            "filename": Path(compressed_file).name,
            "file": encode_file_to_base64(str(compressed_file)),
        }
