from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from core.security import get_current_user, require_admin
from db.supabase import get_supabase
from schemas.schemas import ProfileUpdate

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("/me")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return current_user


@router.patch("/me")
async def update_my_profile(payload: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    update_data = payload.model_dump(exclude_none=True)
    if "date_of_birth" in update_data and update_data["date_of_birth"]:
        update_data["date_of_birth"] = str(update_data["date_of_birth"])
    result = supabase.table("profiles").update(update_data).eq("id", current_user["id"]).execute()
    return result.data[0] if result.data else current_user


@router.get("/search")
async def search_patients(q: Optional[str] = None, admin: dict = Depends(require_admin)):
    """Admin: search patients by name, email, or phone"""
    supabase = get_supabase()
    query = supabase.table("profiles").select("*").eq("role", "patient")
    if q:
        query = query.or_(f"full_name.ilike.%{q}%,email.ilike.%{q}%,phone.ilike.%{q}%")
    result = query.order("full_name").execute()
    return result.data or []


@router.get("/{patient_id}/summary")
async def get_patient_summary(patient_id: str, admin: dict = Depends(require_admin)):
    supabase = get_supabase()
    profile = supabase.table("profiles").select("*").eq("id", patient_id).single().execute()
    if not profile.data:
        raise HTTPException(status_code=404, detail="Patient not found")

    visits = supabase.table("visits").select("id").eq("patient_id", patient_id).execute()
    medicines = supabase.table("medicines").select("*").eq("patient_id", patient_id).eq("is_active", True).execute()
    reports = supabase.table("reports").select("*").eq("patient_id", patient_id).execute()
    exercise = supabase.table("exercise_plans").select("*").eq("patient_id", patient_id).order("created_at", desc=True).limit(1).execute()

    return {
        "profile": profile.data,
        "total_visits": len(visits.data or []),
        "active_medicines": medicines.data or [],
        "reports": reports.data or [],
        "latest_exercise_plan": exercise.data[0] if exercise.data else None,
    }
