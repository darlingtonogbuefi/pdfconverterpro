# backend/core/config.py

import os
import pytesseract

# Optional: only needed if you explicitly call poppler binaries
POPPLER_PATH = os.getenv("POPPLER_PATH")

# Tesseract binary location (Linux or Windows)
TESSERACT_CMD = os.getenv("TESSERACT_CMD", "tesseract")

# Configure pytesseract
pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD
