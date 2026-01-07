# FastAPI File Converter Backend

A Python FastAPI backend for file conversions (PDF, Word, Excel).

## Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install fastapi uvicorn python-multipart pdf2docx PyMuPDF python-docx reportlab openpyxl tabula-py pytesseract Pillow
```

3. Install Tesseract OCR (for image-to-text):
- **macOS**: `brew install tesseract`
- **Ubuntu**: `sudo apt-get install tesseract-ocr`
- **Windows**: Download from https://github.com/UB-Mannheim/tesseract/wiki

4. Run the server:
```bash
uvicorn main:app --reload --port 8000
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/convert/pdf-to-word` | POST | Convert PDF to DOCX |
| `/api/convert/word-to-pdf` | POST | Convert DOCX to PDF |
| `/api/convert/pdf-to-excel` | POST | Convert PDF tables to XLSX |
| `/api/convert/excel-to-pdf` | POST | Convert XLSX to PDF |

## Environment Variables

Set `FRONTEND_URL` to allow CORS from your frontend (default: `http://localhost:5173`).
