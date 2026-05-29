from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Dependency to extract and validate JWT user."""
    token = credentials.credentials
    # Allow demo tokens
    if token.startswith("demo-") or token.startswith("jwt-mock-token-") or token.startswith("jwt-new-token-") or token == "clerk-token":
        return {
            "id": "demo-user",
            "name": "Alex Recruiter",
            "email": "demo@hiremind.ai",
            "role": "recruiter",
        }
    
    try:
        # Support Clerk tokens in development/demo mode without signature verification errors
        payload = jwt.get_unverified_claims(token)
        is_clerk = payload.get("sub", "").startswith("user_") or ("iss" in payload and "clerk" in payload["iss"])
        if is_clerk:
            return {
                "id": payload.get("sub", "clerk-user"),
                "name": payload.get("name", payload.get("username", "Recruiter User")),
                "email": payload.get("email", ""),
                "role": "recruiter",
            }
    except Exception:
        pass

    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return payload


async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
