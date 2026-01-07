# backend\routers\image.py

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pathlib import Path
from typing import List, Union
import tempfile

from backend.utils.file_utils import encode_file_to_base64
from backend.services import image_to_word, image_to_excel
from backend.services.pdf_to_images import convert_pdf_to_images
from backend.services.images_to_pdf import convert_images_to_pdf
from backend.schemas.common import FileResponse

router = APIRouter(prefix="/api/convert", tags=["Image"])

# ----------------------
# Image → Word
# ----------------------
@router.post("/image-to-word")
async def convert_image_to_word(file: Union[UploadFile, List[UploadFile]] = File(...)):
    """
    Convert a single image to a Word document using OCR.
    Accepts .png, .jpg, .jpeg, .tiff files.
    """
    # Defensive: if a list of files is passed, use the first one
    if isinstance(file, list):
        if not file:
            raise HTTPException(400, "No file uploaded")
        file = file[0]

    print("Received file:", file.filename, file.content_type)

    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".tiff")):
        raise HTTPException(400, "File must be an image")

    try:
        with tempfile.TemporaryDirectory() as tmp:
            img_path = Path(tmp) / file.filename
            word_path = Path(tmp) / "output.docx"

            # Write uploaded file to temp directory
            img_path.write_bytes(await file.read())

            # Convert image to Word
            image_to_word.image_to_word(str(img_path), str(word_path))

            return FileResponse(
                filename=img_path.stem + ".docx",
                file=encode_file_to_base64(str(word_path))
            )
    except Exception as e:
        raise HTTPException(500, str(e))


# ----------------------
# Image → Excel
# ----------------------
@router.post("/image-to-excel")
async def convert_image_to_excel(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".tiff")):
        raise HTTPException(400, "File must be an image")
    try:
        with tempfile.TemporaryDirectory() as tmp:
            img_path = Path(tmp) / file.filename
            xlsx_path = Path(tmp) / "output.xlsx"

            img_path.write_bytes(await file.read())
            image_to_excel.image_to_excel(str(img_path), str(xlsx_path))

            return FileResponse(
                filename=img_path.stem + ".xlsx",
                file=encode_file_to_base64(str(xlsx_path))
            )
    except Exception as e:
        raise HTTPException(500, str(e))


# ----------------------
# Images → PDF
# ----------------------
@router.post("/images-to-pdf", response_model=FileResponse)
async def images_to_pdf(
    files: List[UploadFile] = File(...),
    pdf_name: str = Form("images.pdf")
):
    """
    Convert uploaded images into a PDF.
    Each image is scaled to fit the page while maintaining aspect ratio and centered.
    """
    try:
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            image_paths = []

            for file in files:
                if not file.filename.lower().endswith((".png", ".jpg", ".jpeg", ".tiff")):
                    raise HTTPException(400, f"{file.filename} is not a valid image")

                img_path = tmp_dir / file.filename
                img_path.write_bytes(await file.read())
                image_paths.append(str(img_path))

            base64_pdf = convert_images_to_pdf(image_paths, str(tmp_dir / "output.pdf"))

            return FileResponse(filename=pdf_name, file=base64_pdf)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ----------------------
# PDF → Images
# ----------------------
@router.post("/pdf-to-images")
async def pdf_to_images(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "File must be a PDF")
    try:
        with tempfile.TemporaryDirectory() as tmp:
            pdf_path = Path(tmp) / file.filename
            pdf_path.write_bytes(await file.read())
            images = convert_pdf_to_images(str(pdf_path), tmp)

            return {
                "success": True,
                "images": images,  # list of base64 PNGs
            }
    except Exception as e:
        raise HTTPException(500, str(e))
