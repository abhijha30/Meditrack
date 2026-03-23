from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import List, Optional
from core.security import get_current_user, require_admin
from db.supabase import get_supabase
import uuid

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/my")
async def get_my_reports(current_user: dict = Depends(get_current_user)):
    """Patient: get own reports"""
    supabase = get_supabase()
    result = supabase.table("reports").select("*").eq(
        "patient_id", current_user["id"]
    ).order("created_at", desc=True).execute()
    return result.data or []


@router.post("/upload")
async def upload_report(
    patient_email: str = Form(...),
    title: str = Form(...),
    report_type: str = Form("lab"),
    lab_name: Optional[str] = Form(None),
    report_date: Optional[str] = Form(None),
    findings: Optional[str] = Form(None),
    visit_id: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    admin: dict = Depends(require_admin),
):
    """Admin: upload a report (with optional file) for a patient"""
    supabase = get_supabase()

    # Get patient
    patient = supabase.table("profiles").select("id").eq("email", patient_email).single().execute()
    if not patient.data:
        raise HTTPException(status_code=404, detail="Patient not found")
    patient_id = patient.data["id"]

    file_url = None
    file_name = None

    # Upload file to Supabase Storage if provided
    if file and file.filename:
        file_bytes = await file.read()
        storage_path = f"{patient_id}/{uuid.uuid4()}_{file.filename}"
        try:
            supabase.storage.from_("medical-files").upload(
                path=storage_path,
                file=file_bytes,
                file_options={"content-type": file.content_type or "application/octet-stream"},
            )
            # Get signed URL (valid 7 days, renewable)
            signed = supabase.storage.from_("medical-files").create_signed_url(storage_path, 60 * 60 * 24 * 7)
            file_url = signed.get("signedURL")
            file_name = file.filename
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")

    report_data = {
        "patient_id": patient_id,
        "visit_id": visit_id,
        "title": title,
        "report_type": report_type,
        "lab_name": lab_name,
        "report_date": report_date,
        "findings": findings,
        "file_url": file_url,
        "file_name": file_name,
        "status": "normal",
    }
    result = supabase.table("reports").insert(report_data).execute()
    return result.data[0]


@router.get("/patient/{patient_id}")
async def get_patient_reports(patient_id: str, admin: dict = Depends(require_admin)):
    supabase = get_supabase()
    result = supabase.table("reports").select("*").eq(
        "patient_id", patient_id
    ).order("created_at", desc=True).execute()
    return result.data or []
