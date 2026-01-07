from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
from jose import jwt
from backend.core.security import SECRET_KEY, ALGORITHM

security = HTTPBearer()

def require_auth(token=Depends(security)):
    try:
        return jwt.decode(
            token.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except:
        raise HTTPException(401, "Invalid or expired token")
