# Deployment Guide — MediTrack

## Prerequisites
- Node.js 18+ installed
- Python 3.11+ installed
- Git installed
- Accounts on: GitHub, Supabase, Vercel

---

## Step 1 — Supabase Setup

1. Go to https://supabase.com → Sign up → New project
2. Note your **Project URL** and keys from: Settings → API
   - `URL` → used as `SUPABASE_URL`
   - `anon public` key → used as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → used as `SUPABASE_KEY` (backend only, never expose)
   - JWT secret → Settings → API → JWT Settings → used as `SUPABASE_JWT_SECRET`

3. Run migrations:
   - Go to **SQL Editor** in Supabase dashboard
   - Paste contents of `supabase/migrations/001_init.sql` → Click **Run**
   - Paste contents of `supabase/migrations/002_storage.sql` → Click **Run**

---

## Step 2 — GitHub Repository

```bash
# In project root
git init
git add .
git commit -m "Initial commit: MediTrack"

# Create repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/meditrack.git
git branch -M main
git push -u origin main
```

---

## Step 3 — Deploy Backend to Vercel

```bash
cd backend

# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

When prompted:
- Set up and deploy? **Y**
- Which scope? → your account
- Link to existing project? **N**
- Project name: `meditrack-backend`
- Directory: `./` (current)
- Override settings? **N**

After deploy, go to **Vercel Dashboard → meditrack-backend → Settings → Environment Variables** and add:
```
SUPABASE_URL         = https://xxxx.supabase.co
SUPABASE_KEY         = your-service-role-key
SUPABASE_JWT_SECRET  = your-jwt-secret
SECRET_KEY           = any-random-32-char-string
FRONTEND_URL         = https://meditrack-frontend.vercel.app  (add after frontend deploy)
```

Redeploy after adding env vars: `vercel --prod`

Note your backend URL: `https://meditrack-backend-xxxx.vercel.app`

---

## Step 4 — Deploy Frontend to Vercel

```bash
cd ../frontend

vercel --prod
```

When prompted:
- Project name: `meditrack-frontend`

After deploy, go to **Vercel Dashboard → meditrack-frontend → Settings → Environment Variables** and add:
```
NEXT_PUBLIC_SUPABASE_URL       = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY  = your-anon-key
NEXT_PUBLIC_API_URL            = https://meditrack-backend-xxxx.vercel.app
```

Redeploy: `vercel --prod`

---

## Step 5 — GitHub Actions (Auto Deploy)

Add secrets to your GitHub repo:
→ GitHub repo → Settings → Secrets and variables → Actions → New repository secret

| Secret name                  | Value |
|------------------------------|-------|
| `VERCEL_TOKEN`               | Vercel → Account Settings → Tokens → Create token |
| `VERCEL_ORG_ID`              | Vercel → Account Settings → General → Your ID |
| `VERCEL_FRONTEND_PROJECT_ID` | Vercel → meditrack-frontend project → Settings → General → Project ID |
| `VERCEL_BACKEND_PROJECT_ID`  | Vercel → meditrack-backend project → Settings → General → Project ID |
| `NEXT_PUBLIC_SUPABASE_URL`   | same as above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same as above |
| `NEXT_PUBLIC_API_URL`        | your backend vercel URL |

Now every push to `main` auto-deploys both frontend and backend.

---

## Step 6 — Test the app

1. Open your frontend URL
2. Register as a **patient** with your email
3. Register another account as **Hospital Admin**
4. Log in as admin → search for the patient → Upload record
5. Log back in as patient → see the record on dashboard

---

## Local Development

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in values
uvicorn main:app --reload --port 8000
# API docs at: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local  # fill in values
npm run dev
# Open: http://localhost:3000
```
