# MediTrack — Personal Health Records Platform

A full-stack health records web app where patients can view their medical history and hospital admins can upload records, prescriptions, lab reports, and exercise advice.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (React) + Tailwind CSS |
| Backend API | FastAPI (Python) |
| Database | Supabase (PostgreSQL) |
| File Storage | Supabase Storage |
| Auth | Supabase Auth (Email + OTP) |
| Deployment (Frontend) | Vercel |
| Deployment (Backend) | Vercel Serverless Functions |

---

## Project Structure

```
meditrack/
├── backend/                  # FastAPI Python backend
│   ├── api/routes/           # Route handlers
│   ├── core/                 # Config, security
│   ├── db/                   # Supabase client
│   ├── models/               # SQLAlchemy models
│   ├── schemas/              # Pydantic schemas
│   ├── services/             # Business logic
│   ├── main.py               # FastAPI app entry
│   └── requirements.txt
├── frontend/                 # Next.js frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/            # Next.js pages
│   │   ├── hooks/            # Custom React hooks
│   │   └── lib/              # API client, utils
│   ├── package.json
│   └── next.config.js
├── supabase/
│   └── migrations/           # SQL schema migrations
├── vercel.json               # Vercel deployment config
└── .github/workflows/        # CI/CD pipeline
```

---

## Quick Start

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/meditrack.git
cd meditrack
```

### 2. Set up Supabase
1. Go to [supabase.com](https://supabase.com) → New project
2. Copy your **Project URL** and **anon key** from Settings → API
3. Run the migration SQL in Supabase → SQL Editor (paste contents of `supabase/migrations/001_init.sql`)

### 3. Backend setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # Fill in your Supabase credentials
uvicorn main:app --reload
```

### 4. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env.local      # Fill in your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

### Backend (`backend/.env`)
```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret
SECRET_KEY=your-random-secret-key-32chars
```

### Frontend (`frontend/.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
```

---

## Deploy to Vercel

### Frontend
```bash
cd frontend
npx vercel --prod
```

### Backend
```bash
cd backend
npx vercel --prod
```

> Add all environment variables in Vercel Dashboard → Settings → Environment Variables

---

## User Roles

| Role | Can do |
|---|---|
| **Patient** | Login, view own records, download reports |
| **Hospital Admin** | Login, search patients, upload records, prescriptions, reports |

---

## Features
- Email + OTP login (via Supabase Auth)
- Patient dashboard with visit history, medicines, lab reports
- Admin panel to upload patient records
- File upload (PDFs, images) stored in Supabase Storage
- Full medical timeline per patient
- Email notifications when new record is added
- Role-based access control (patient vs admin)
