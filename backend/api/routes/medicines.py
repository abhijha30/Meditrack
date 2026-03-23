from fastapi import APIRouter, Depends, HTTPException
from core.security import get_current_user, require_admin
from db.supabase import get_supabase

router = APIRouter(prefix="/medicines", tags=["medicines"])


@router.get("/my")
async def get_my_medicines(current_user: dict = Depends(get_current_user)):
    """Patient: get all own medicines (active only by default)"""
    supabase = get_supabase()
    result = supabase.table("medicines").select("*, visits(doctor_name, visit_date, hospital_name)").eq(
        "patient_id", current_user["id"]
    ).eq("is_active", True).execute()
    return result.data or []


@router.patch("/{medicine_id}/deactivate")
async def deactivate_medicine(medicine_id: str, admin: dict = Depends(require_admin)):
    """Admin: mark medicine as no longer active"""
    supabase = get_supabase()
    result = supabase.table("medicines").update({"is_active": False}).eq("id", medicine_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return result.data[0]
