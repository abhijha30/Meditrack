from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import auth, visits, reports, patients, medicines

app = FastAPI(
    title="MediTrack API",
    description="Personal Health Records Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api")
app.include_router(visits.router,    prefix="/api")
app.include_router(reports.router,   prefix="/api")
app.include_router(patients.router,  prefix="/api")
app.include_router(medicines.router, prefix="/api")

@app.get("/")
def root():
    return {"status": "MediTrack API is running", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
