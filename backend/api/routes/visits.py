from fastapi import APIRouter, Depends, HTTPException
from typing import List
from schemas.schemas import VisitCreate, VisitOut
from core.security import get_current_user, require_admin
from db.supabase import get_supabase
from services.email import send_new_record_email

router = APIRouter(prefix="/visits", tags=["visits"])


@router.get("/my", response_model=List[VisitOut])
async def get_my_visits(current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    visits = supabase.table("visits").select("*, medicines(*)").eq(
        "patient_id", current_user["id"]
    ).order("visit_date", desc=True).execute()
    return visits.data or []


@router.get("/{visit_id}", response_model=VisitOut)
async def get_visit(visit_id: str, current_user: dict = Depends(get_current_user)):
    supabase = get_supabase()
    result = supabase.table("visits").select("*, medicines(*), exercise_plans(*)").eq(
        "id", visit_id
    ).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Visit not found")
    visit = result.data
    if current_user["role"] == "patient" and visit["patient_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return visit


@router.post("/", response_model=VisitOut)
async def create_visit(payload: VisitCreate, admin: dict = Depends(require_admin)):
    supabase = get_supabase()
    patient_result = supabase.table("profiles").select("id,full_name,email").eq(
        "email", payload.patient_email
    ).eq("role", "patient").single().execute()
    if not patient_result.data:
        raise HTTPException(status_code=404, detail=f"Patient '{payload.patient_email}' not found.")

    patient = patient_result.data
    patient_id = patient["id"]

    visit_data = {
        "patient_id": patient_id,
        "admin_id": admin["id"],
        "hospital_name": payload.hospital_name,
        "doctor_name": payload.doctor_name,
        "department": payload.department,
        "visit_date": str(payload.visit_date),
        "diagnosis": payload.diagnosis,
        "doctor_notes": payload.doctor_notes,
        "follow_up_date": str(payload.follow_up_date) if payload.follow_up_date else None,
        "status": "completed",
    }
    visit = supabase.table("visits").insert(visit_data).execute()
    visit_id = visit.data[0]["id"]

    if payload.medicines:
        med_rows = [
            {**m.model_dump(), "visit_id": visit_id, "patient_id": patient_id}
            for m in payload.medicines
        ]
        supabase.table("medicines").insert(med_rows).execute()

    if payload.exercise_plan:
        supabase.table("exercise_plans").insert({
            **payload.exercise_plan.model_dump(),
            "visit_id": visit_id,
            "patient_id": patient_id,
        }).execute()

    send_new_record_email(
        patient_email=patient["email"],
        patient_name=patient["full_name"],
        doctor_name=payload.doctor_name,
        hospital=payload.hospital_name or "Hospital",
        visit_date=str(payload.visit_date),
    )

    result = supabase.table("visits").select("*, medicines(*)").eq("id", visit_id).single().execute()
    return result.data


@router.get("/patient/{patient_id}", response_model=List[VisitOut])
async def get_patient_visits(patient_id: str, admin: dict = Depends(require_admin)):
    supabase = get_supabase()
    visits = supabase.table("visits").select("*, medicines(*), exercise_plans(*)").eq(
        "patient_id", patient_id
    ).order("visit_date", desc=True).execute()
    return visits.data or []


@router.delete("/{visit_id}")
async def delete_visit(visit_id: str, admin: dict = Depends(require_admin)):
    supabase = get_supabase()
    supabase.table("visits").delete().eq("id", visit_id).execute()
    return {"message": "Deleted"}
