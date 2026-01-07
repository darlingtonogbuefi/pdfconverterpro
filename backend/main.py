# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware
from backend.routers import pdf, office, image, nutrient, pdf_edit 
from backend.core.limiter import limiter
from backend.routers import pdf_watermark



app = FastAPI(
    title="Universal File Converter API",
    description="Convert, edit, split, merge, watermark & sign files",
    version="2.2.0",
)

app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# existing routers
app.include_router(pdf.router)
app.include_router(office.router)
app.include_router(image.router)
app.include_router(nutrient.router)
app.include_router(pdf_watermark.router)
app.include_router(pdf_edit.router)

@app.get("/health")
async def health():
    return {"status": "ok"}
