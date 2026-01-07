# backend/routers/pdf_watermark.py


from fastapi import APIRouter, UploadFile, File, Form
from fastapi.responses import FileResponse
from tempfile import NamedTemporaryFile
import os
import json

from backend.services.pdf_watermark import add_watermark_to_pdf
from backend.schemas.pdf_watermark import WatermarkRequest, TextWatermark, ImageWatermark, GridOptions, InsertOptions

router = APIRouter(prefix="/api/convert/pdf-watermark", tags=["PDF Watermark"])


@router.post("")
async def watermark_pdf(
    file: UploadFile = File(...),
    payload: str = Form(...),  # JSON string containing watermark + placement
    image: UploadFile | None = File(None),
):
    """
    Apply a text or image watermark to an uploaded PDF.
    Expects a JSON payload containing 'watermark' and 'placement' objects.
    Optionally accepts an image file for image watermarks.
    """

    # Save uploaded PDF
    with NamedTemporaryFile(delete=False, suffix=".pdf") as input_pdf:
        input_pdf.write(await file.read())
        input_pdf_path = input_pdf.name

    # Save optional watermark image
    image_path = None
    if image:
        ext = os.path.splitext(image.filename)[1]
        with NamedTemporaryFile(delete=False, suffix=ext) as img:
            img.write(await image.read())
            image_path = img.name

    # Parse JSON payload
    try:
        payload_data = json.loads(payload)
        watermark_data = payload_data["watermark"]
        placement_data = payload_data["placement"]
    except (json.JSONDecodeError, KeyError):
        return {"error": "Invalid payload structure"}

    # Create watermark object
    if watermark_data["type"] == "text":
        watermark = TextWatermark(**watermark_data)
    elif watermark_data["type"] == "image":
        watermark = ImageWatermark(**watermark_data)
    else:
        return {"error": "Invalid watermark type"}

    # Create placement object
    if placement_data.get("mode") == "grid":
        placement = GridOptions(**placement_data)
    else:
        placement = InsertOptions(**placement_data)

    # Output PDF path
    output_pdf_path = NamedTemporaryFile(delete=False, suffix=".pdf").name

    # Add watermark
    add_watermark_to_pdf(
        input_pdf=input_pdf_path,
        output_pdf=output_pdf_path,
        watermark=watermark,
        placement=placement,
        image_path=image_path,
    )

    # Cleanup temp files
    os.remove(input_pdf_path)
    if image_path:
        os.remove(image_path)

    return FileResponse(
        output_pdf_path,
        filename=f"watermarked_{file.filename}",
        media_type="application/pdf",
    )
