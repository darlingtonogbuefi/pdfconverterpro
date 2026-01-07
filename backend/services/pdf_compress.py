# backend/services/pdf_compress.py
from pathlib import Path
import pikepdf
import subprocess
import os
import io
from PIL import Image, ImageFile

# Allow Pillow to load truncated images (common in scanned PDFs)
ImageFile.LOAD_TRUNCATED_IMAGES = True

# Ghostscript path (env variable fallback)
GS_PATH = os.getenv(
    "GHOSTSCRIPT_PATH",
    r"C:\Program Files\gs\gs10.06.0\bin\gswin64c.exe"
)

# Optional image recompression JPEG quality
IMAGE_QUALITY = 25  # 20–30 is aggressive compression

def _run_ghostscript(input_pdf: Path, output_pdf: Path, compression_level: str = "max"):
    """Run Ghostscript compression"""
    if not Path(GS_PATH).exists():
        raise RuntimeError(f"Ghostscript not found at {GS_PATH}")

    level_map = {
        "light": "printer",   # higher quality
        "medium": "ebook",    # medium quality
        "max": "screen"       # lowest quality, max compression
    }
    gs_quality = level_map.get(compression_level, "screen")

    cmd = [
        GS_PATH,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS=/{gs_quality}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_pdf}",
        str(input_pdf),
    ]
    subprocess.run(cmd, check=True)

def _recompress_images(pdf_path: Path, output_path: Path, quality: int = IMAGE_QUALITY):
    """Recompress images inside PDF using Pillow"""
    with pikepdf.open(pdf_path) as pdf:
        for page in pdf.pages:
            images = dict(page.images)
            for name, img_obj in images.items():
                try:
                    img = pikepdf.PdfImage(img_obj)
                    pil_img = img.as_pil_image()
                    buf = io.BytesIO()
                    pil_img.save(buf, format="JPEG", quality=quality, optimize=True)
                    buf.seek(0)
                    img_obj.stream = buf.read()
                except Exception as e:
                    # Skip images that Pillow cannot process
                    print(f"Warning: Failed to recompress an image: {e}")
        pdf.save(output_path)

def compress_pdf(
    input_path: str,
    output_path: str,
    remove_metadata: bool = True,
    select_pages: str = "",
    recompress_images: bool = True,
    compression_level: str = "max",  # light | medium | max
):
    """
    Compress PDF for maximum file reduction.
    Steps:
    1. Remove metadata & annotations (PikePDF)
    2. Optional image recompression
    3. Ghostscript compression
    """
    input_path = Path(input_path)
    output_path = Path(output_path)
    tmp_pdf = output_path.with_suffix(".tmp.pdf")

    # -----------------------
    # Parse selected pages
    # -----------------------
    pages_to_keep = None
    if select_pages:
        pages_to_keep = set()
        for part in select_pages.split(","):
            if "-" in part:
                start, end = map(int, part.split("-"))
                pages_to_keep.update(range(start, end + 1))
            else:
                pages_to_keep.add(int(part))

    # -----------------------
    # PikePDF preprocessing
    # -----------------------
    with pikepdf.open(input_path) as pdf:
        if remove_metadata:
            for key in list(pdf.docinfo.keys()):
                del pdf.docinfo[key]
            if "/Metadata" in pdf.Root:
                del pdf.Root["/Metadata"]

        # Remove annotations and AcroForms safely
        for page in pdf.pages:
            if "/Annots" in page.obj:
                del page.obj["/Annots"]
            if "/AcroForm" in page.obj:
                del page.obj["/AcroForm"]

        # Page selection
        if pages_to_keep:
            new_pdf = pikepdf.Pdf.new()
            for i, page in enumerate(pdf.pages, start=1):
                if i in pages_to_keep:
                    new_pdf.pages.append(page)
            pdf = new_pdf

        pdf.save(tmp_pdf)

    # -----------------------
    # Optional image recompression
    # -----------------------
    if recompress_images:
        tmp_recomp = output_path.with_suffix(".recomp.pdf")
        _recompress_images(tmp_pdf, tmp_recomp, quality=IMAGE_QUALITY)
        tmp_pdf.unlink(missing_ok=True)
        tmp_pdf = tmp_recomp

    # -----------------------
    # Ghostscript compression
    # -----------------------
    try:
        _run_ghostscript(tmp_pdf, output_path, compression_level=compression_level)
        tmp_pdf.unlink(missing_ok=True)
    except Exception as e:
        # fallback to PikePDF-compressed PDF if Ghostscript fails
        print(f"Warning: Ghostscript compression failed: {e}")
        output_path = tmp_pdf

    # -----------------------
    # Size check
    # -----------------------
    in_size = input_path.stat().st_size
    out_size = output_path.stat().st_size

    if out_size >= in_size:
        return str(input_path), in_size

    return str(output_path), out_size
