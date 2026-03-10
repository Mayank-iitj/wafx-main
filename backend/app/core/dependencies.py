"""FastAPI dependencies — auth, DB, Redis, RBAC enforcement."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, Request, WebSocket, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.models import User, UserRole

settings = get_settings()
_bearer = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(_bearer)],
    db: Annotated[AsyncSession, Depends(get_db)],
) -> User:
    """Extract and validate JWT from Authorization header, return the User."""
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        payload = decode_token(credentials.credentials)
        if payload.get("type") != "access":
            raise JWTError("Invalid token type")
        user_id = UUID(payload["sub"])
    except (JWTError, KeyError, ValueError) as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


async def get_ws_user(websocket: WebSocket, db: Annotated[AsyncSession, Depends(get_db)]) -> User:
    """Authenticate WebSocket connections via query-param token."""
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    try:
        payload = decode_token(token)
        user_id = UUID(payload["sub"])
    except (JWTError, KeyError, ValueError):
        await websocket.close(code=4001, reason="Invalid token")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    result = await db.execute(select(User).where(User.id == user_id, User.is_active.is_(True)))
    user = result.scalar_one_or_none()
    if user is None:
        await websocket.close(code=4001, reason="User not found")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return user


# ── RBAC helpers ────────────────────────────────────────────────────────────

class RoleChecker:
    """Dependency factory for RBAC enforcement."""

    def __init__(self, allowed_roles: list[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: Annotated[User, Depends(get_current_user)]) -> User:
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{user.role.value}' lacks permission",
            )
        return user


require_admin = RoleChecker([UserRole.ADMIN])
require_analyst = RoleChecker([UserRole.ADMIN, UserRole.ANALYST])
require_viewer = RoleChecker([UserRole.ADMIN, UserRole.ANALYST, UserRole.VIEWER])


# ── Convenience type aliases ────────────────────────────────────────────────
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(require_admin)]
AnalystUser = Annotated[User, Depends(require_analyst)]
DBSession = Annotated[AsyncSession, Depends(get_db)]
