from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime

# ─── Auth ────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str = "patient"           # "patient" or "admin"
    hospital_name: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

# ─── Profile ─────────────────────────────────────────────
class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[date] = None
    blood_group: Optional[str] = None

# ─── Medicine ────────────────────────────────────────────
class MedicineCreate(BaseModel):
    name: str
    dosage: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None

class MedicineOut(MedicineCreate):
    id: str
    visit_id: str
    is_active: bool
    created_at: datetime

# ─── Exercise Plan ───────────────────────────────────────
class ExercisePlanCreate(BaseModel):
    advice: str
    restrictions: Optional[str] = None
    duration_weeks: Optional[int] = None

# ─── Visit ───────────────────────────────────────────────
class VisitCreate(BaseModel):
    patient_email: str              # admin identifies patient by email
    hospital_name: Optional[str] = None
    doctor_name: str
    department: Optional[str] = None
    visit_date: date
    diagnosis: Optional[str] = None
    doctor_notes: Optional[str] = None
    follow_up_date: Optional[date] = None
    medicines: List[MedicineCreate] = []
    exercise_plan: Optional[ExercisePlanCreate] = None

class VisitOut(BaseModel):
    id: str
    patient_id: str
    doctor_name: str
    department: Optional[str]
    visit_date: date
    diagnosis: Optional[str]
    doctor_notes: Optional[str]
    follow_up_date: Optional[date]
    hospital_name: Optional[str]
    status: str
    created_at: datetime
    medicines: List[MedicineOut] = []

# ─── Report ──────────────────────────────────────────────
class ReportOut(BaseModel):
    id: str
    title: str
    report_type: str
    lab_name: Optional[str]
    report_date: Optional[date]
    findings: Optional[str]
    file_url: Optional[str]
    file_name: Optional[str]
    status: str
    created_at: datetime

# ─── Patient Summary (for admin) ─────────────────────────
class PatientSummary(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str]
    date_of_birth: Optional[date]
    blood_group: Optional[str]
    total_visits: int = 0
