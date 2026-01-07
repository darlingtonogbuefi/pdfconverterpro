from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "CHANGE_ME_NOW"
ALGORITHM = "HS256"

def create_token(data: dict, expires_minutes: int = 60):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=expires_minutes)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
