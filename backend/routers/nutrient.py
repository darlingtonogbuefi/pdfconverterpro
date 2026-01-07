# backend/routers/nutrient.py

import os
import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api", tags=["Nutrient"])

NUTRIENT_API_KEY = os.getenv("NUTRIENT_API_KEY")
NUTRIENT_SESSION_URL = "https://api.nutrient.io/session"  # For creating a viewer session

@router.get("/nutrient-session")
async def get_nutrient_session(fileName: str = Query(...)):
    """
    Create a Nutrient session token for a PDF file
    """
    if not NUTRIENT_API_KEY:
        raise HTTPException(status_code=500, detail="Nutrient API key not configured")

    payload = {
        "fileName": fileName,
        "permissions": {
            "sign": True,
            "annotate": True,
        },
    }

    headers = {
        "Authorization": f"Bearer {NUTRIENT_API_KEY}",
        "Content-Type": "application/json",
    }

    resp = requests.post(NUTRIENT_SESSION_URL, json=payload, headers=headers)
    if not resp.ok:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    data = resp.json()
    return {"sessionToken": data.get("sessionToken")}
