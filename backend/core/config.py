import os
from dotenv import load_dotenv
import pytesseract

# Load the .env file
load_dotenv()  # loads .env from project root

# ---------- Tesseract / Poppler ----------
POPPLER_PATH = os.getenv("POPPLER_PATH")
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "tesseract")
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD

# ---------- AWS / S3 / SQS ----------
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
SQS_QUEUE_URL = os.getenv("SQS_QUEUE_URL")

# ---------- Backend & API ----------
VITE_BACKEND_URL = os.getenv("VITE_BACKEND_URL")
NUTRIENT_API_KEY = os.getenv("NUTRIENT_API_KEY")

# ---------- Database ----------
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 5432))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

