-- ============================================================
-- MediTrack Database Schema
-- Run this in Supabase SQL Editor: Project → SQL Editor → New query
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  blood_group TEXT,
  role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'admin')),
  hospital_name TEXT,           -- only for admin
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HOSPITALS
-- ============================================================
CREATE TABLE public.hospitals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VISITS (each hospital visit)
-- ============================================================
CREATE TABLE public.visits (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  hospital_id UUID REFERENCES public.hospitals(id) ON DELETE SET NULL,
  hospital_name TEXT,                -- fallback if hospital not in DB
  doctor_name TEXT NOT NULL,
  department TEXT,
  visit_date DATE NOT NULL,
  diagnosis TEXT,
  doctor_notes TEXT,
  follow_up_date DATE,
  status TEXT DEFAULT 'completed' CHECK (status IN ('scheduled', 'in_progress', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- MEDICINES (per visit)
-- ============================================================
CREATE TABLE public.medicines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dosage TEXT,                       -- e.g. "1 tab 3x daily after meals"
  duration TEXT,                     -- e.g. "5 days"
  instructions TEXT,                 -- e.g. "avoid alcohol"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LAB REPORTS
-- ============================================================
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,               -- e.g. "CBC Blood Test"
  report_type TEXT DEFAULT 'lab' CHECK (report_type IN ('lab', 'scan', 'xray', 'prescription', 'other')),
  lab_name TEXT,
  report_date DATE,
  findings TEXT,
  file_url TEXT,                     -- Supabase Storage URL
  file_name TEXT,
  status TEXT DEFAULT 'normal' CHECK (status IN ('normal', 'abnormal', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXERCISE / LIFESTYLE ADVICE (per visit)
-- ============================================================
CREATE TABLE public.exercise_plans (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  visit_id UUID REFERENCES public.visits(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  advice TEXT NOT NULL,
  restrictions TEXT,
  duration_weeks INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read their own, admins can read all
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Visits: patients see own, admins see all + can insert
CREATE POLICY "Patients view own visits" ON public.visits
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Admins view all visits" ON public.visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins insert visits" ON public.visits
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins update visits" ON public.visits
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Medicines
CREATE POLICY "Patients view own medicines" ON public.medicines
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Admins manage medicines" ON public.medicines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reports
CREATE POLICY "Patients view own reports" ON public.reports
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Admins manage reports" ON public.reports
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Exercise plans
CREATE POLICY "Patients view own plans" ON public.exercise_plans
  FOR SELECT USING (patient_id = auth.uid());

CREATE POLICY "Admins manage exercise plans" ON public.exercise_plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Hospitals: everyone can read
CREATE POLICY "Anyone can view hospitals" ON public.hospitals
  FOR SELECT USING (TRUE);

CREATE POLICY "Admins manage hospitals" ON public.hospitals
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SUPABASE STORAGE BUCKET
-- Run separately after creating bucket named 'medical-files'
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public) VALUES ('medical-files', 'medical-files', false);

-- Storage policy: patients download own files, admins manage all
-- CREATE POLICY "Patients access own files" ON storage.objects
--   FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);

-- CREATE POLICY "Admins manage all files" ON storage.objects
--   FOR ALL USING (
--     EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
--   );

-- ============================================================
-- SEED: Sample hospital
-- ============================================================
INSERT INTO public.hospitals (name, address, phone) VALUES
  ('City Hospital', 'MG Road, New Delhi - 110001', '+91 11 2345 6789'),
  ('Apollo Clinic', 'Connaught Place, New Delhi - 110001', '+91 11 9876 5432');
