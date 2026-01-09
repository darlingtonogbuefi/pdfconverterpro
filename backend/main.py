# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from backend.core.limiter import limiter
from backend.routers import pdf, office, image, nutrient, pdf_edit, pdf_watermark


app = FastAPI(
    title="Universal File Converter API",
    description="Convert, edit, split, merge, watermark & sign files",
    version="2.2.0",
)

# ----------------------
# Rate Limiting
# ----------------------
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

# ----------------------
# CORS
# ----------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------
# Routers
# ----------------------
app.include_router(pdf.router)
app.include_router(office.router)
app.include_router(image.router)
app.include_router(nutrient.router)
app.include_router(pdf_watermark.router)
app.include_router(pdf_edit.router)

# ----------------------
# Root + Health Endpoints
# ----------------------
@app.get("/")
async def root():
    return {
        "service": "Universal File Converter API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
