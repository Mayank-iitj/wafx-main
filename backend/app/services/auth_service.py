"""Authentication service — login, register, token refresh, OAuth2."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    hash_password,
    verify_password,
    verify_token_type,
)
from app.models.models import Organization, User, UserRole
from app.schemas.schemas import LoginRequest, RegisterRequest, TokenResponse

logger = logging.getLogger("wafx.auth")
settings = get_settings()


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, payload: RegisterRequest) -> tuple[User, TokenResponse]:
        """Register a new user and their organization."""
        # Check for existing user
        existing = await self.db.execute(select(User).where(User.email == payload.email))
        if existing.scalar_one_or_none():
            raise ValueError("Email already registered")

        # Create organization
        org = Organization(name=payload.org_name)
        self.db.add(org)
        await self.db.flush()

        # Create user
        user = User(
            email=payload.email,
            password_hash=hash_password(payload.password),
            full_name=payload.full_name,
            role=UserRole.ADMIN,
            org_id=org.id,
        )
        self.db.add(user)
        await self.db.flush()

        tokens = self._issue_tokens(user)
        logger.info("User registered: %s (org: %s)", user.email, org.name)
        return user, tokens

    async def login(self, payload: LoginRequest) -> tuple[User, TokenResponse]:
        """Authenticate user with email/password (and optional MFA)."""
        result = await self.db.execute(
            select(User).where(User.email == payload.email, User.is_active.is_(True))
        )
        user = result.scalar_one_or_none()
        if not user or not verify_password(payload.password, user.password_hash):
            raise ValueError("Invalid email or password")

        if user.mfa_enabled:
            if not payload.mfa_code:
                raise ValueError("MFA code required")
            if not self._verify_mfa(user, payload.mfa_code):
                raise ValueError("Invalid MFA code")

        user.last_login = datetime.now(timezone.utc)
        tokens = self._issue_tokens(user)
        logger.info("User logged in: %s", user.email)
        return user, tokens

    async def refresh(self, refresh_token: str) -> TokenResponse:
        """Issue new tokens from a valid refresh token."""
        payload = verify_token_type(refresh_token, "refresh")
        user_id = UUID(payload["sub"])

        result = await self.db.execute(
            select(User).where(User.id == user_id, User.is_active.is_(True))
        )
        user = result.scalar_one_or_none()
        if not user:
            raise ValueError("User not found or inactive")

        return self._issue_tokens(user)

    def _issue_tokens(self, user: User) -> TokenResponse:
        access = create_access_token(
            subject=str(user.id),
            extra_claims={"role": user.role.value, "org_id": str(user.org_id)},
        )
        refresh = create_refresh_token(subject=str(user.id))
        return TokenResponse(
            access_token=access,
            refresh_token=refresh,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )

    @staticmethod
    def _verify_mfa(user: User, code: str) -> bool:
        """Verify TOTP MFA code against user's stored secret."""
        import pyotp

        if not user.mfa_secret:
            return False
        totp = pyotp.TOTP(user.mfa_secret)
        return totp.verify(code, valid_window=1)
