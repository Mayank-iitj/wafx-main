from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from datetime import timedelta
from app.core.security import hash_password, verify_password, create_access_token, get_current_user
from app.core.config import settings

router = APIRouter()

# In-memory user store (production would use PostgreSQL)
users_db: dict = {}


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: str = ""
    role: str = "recruiter"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    company: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


@router.post("/signup", response_model=AuthResponse, summary="Create a new recruiter account")
async def signup(request: SignupRequest):
    if request.email in users_db:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user-{len(users_db) + 1:04d}"
    user = {
        "id": user_id,
        "name": request.name,
        "email": request.email,
        "password_hash": hash_password(request.password),
        "role": request.role,
        "company": request.company,
    }
    users_db[request.email] = user

    token = create_access_token({"sub": user_id, "email": request.email, "role": request.role})
    return AuthResponse(
        access_token=token,
        user=UserResponse(id=user_id, name=request.name, email=request.email, role=request.role, company=request.company),
    )


@router.post("/login", response_model=AuthResponse, summary="Authenticate and get JWT token")
async def login(request: LoginRequest):
    # Demo account bypass
    if request.email == "demo@hiremind.ai":
        token = create_access_token({"sub": "demo-user", "email": request.email, "role": "recruiter"})
        return AuthResponse(
            access_token=token,
            user=UserResponse(id="demo-user", name="Alex Recruiter", email=request.email, role="recruiter", company="Acme Corp"),
        )

    user = users_db.get(request.email)
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token({"sub": user["id"], "email": user["email"], "role": user["role"]})
    return AuthResponse(
        access_token=token,
        user=UserResponse(id=user["id"], name=user["name"], email=user["email"], role=user["role"], company=user["company"]),
    )


@router.get("/me", response_model=UserResponse, summary="Get current authenticated user")
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserResponse(
        id=current_user.get("id", current_user.get("sub", "unknown")),
        name=current_user.get("name", "User"),
        email=current_user.get("email", ""),
        role=current_user.get("role", "recruiter"),
        company=current_user.get("company", ""),
    )
