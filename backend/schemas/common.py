# backend/schemas/common.py

from pydantic import BaseModel
from typing import List, Optional

# ----------------------
# Response for single file operations (e.g., PDF -> Word)
# ----------------------
class FileResponse(BaseModel):
    success: bool = True
    filename: str
    file: str  # base64 encoded file content

# ----------------------
# Response for multiple file operations (e.g., PDF split)
# ----------------------
class MultiFileResponse(BaseModel):
    success: bool = True
    files: List[str]  # list of base64 encoded files

# ----------------------
# Response for PDF split operation
# ----------------------
class SplitPDFResponse(BaseModel):
    success: bool = True
    total_pages: int
    returned_pages: int
    files: List[str]  # list of base64 encoded pages

# ----------------------
# Standard error response
# ----------------------
class ErrorResponse(BaseModel):
    success: bool = False
    detail: str
