from fastapi import APIRouter, HTTPException, status
from schemas.schemas import RegisterRequest, LoginRequest, AuthResponse
from db.supabase import get_supabase

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/register", response_model=AuthResponse)
async def register(payload: RegisterRequest):
    supabase = get_supabase()
    try:
        result = supabase.auth.sign_up({
            "email": payload.email,
            "password": payload.password,
            "options": {
                "data": {
                    "full_name": payload.full_name,
                    "role": payload.role,
                    "hospital_name": payload.hospital_name or "",
                }
            }
        })
        if not result.user:
            raise HTTPException(status_code=400, detail="Registration failed")

        # Update profile with phone if provided
        if payload.phone:
            supabase.table("profiles").update({"phone": payload.phone}).eq("id", result.user.id).execute()

        profile = supabase.table("profiles").select("*").eq("id", result.user.id).single().execute()

        return AuthResponse(
            access_token=result.session.access_token if result.session else "",
            user=profile.data or {}
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    supabase = get_supabase()
    try:
        result = supabase.auth.sign_in_with_password({
            "email": payload.email,
            "password": payload.password,
        })
        if not result.user:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        profile = supabase.table("profiles").select("*").eq("id", result.user.id).single().execute()

        return AuthResponse(
            access_token=result.session.access_token,
            user=profile.data or {}
        )
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/logout")
async def logout():
    supabase = get_supabase()
    supabase.auth.sign_out()
    return {"message": "Logged out successfully"}


@router.post("/otp/send")
async def send_otp(email: str):
    """Send OTP to email for passwordless login"""
    supabase = get_supabase()
    try:
        supabase.auth.sign_in_with_otp({"email": email})
        return {"message": f"OTP sent to {email}"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/otp/verify")
async def verify_otp(email: str, token: str):
    """Verify OTP and return session"""
    supabase = get_supabase()
    try:
        result = supabase.auth.verify_otp({"email": email, "token": token, "type": "email"})
        if not result.session:
            raise HTTPException(status_code=401, detail="Invalid OTP")
        profile = supabase.table("profiles").select("*").eq("id", result.user.id).single().execute()
        return AuthResponse(access_token=result.session.access_token, user=profile.data or {})
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired OTP")
