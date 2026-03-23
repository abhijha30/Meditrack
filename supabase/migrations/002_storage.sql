-- ============================================================
-- Storage Setup — Run AFTER creating the bucket in Supabase Dashboard
-- Supabase Dashboard → Storage → New bucket
--   Name: medical-files
--   Public: OFF (private)
-- Then run this SQL:
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'medical-files',
  'medical-files',
  false,
  52428800,   -- 50MB max file size
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Patients can download their own files (folder = their user id)
CREATE POLICY "Patients download own files"
ON storage.objects FOR SELECT
USING (
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can upload files into any patient folder
CREATE POLICY "Admins upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can read all files
CREATE POLICY "Admins read all files"
ON storage.objects FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Admins can delete files
CREATE POLICY "Admins delete files"
ON storage.objects FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
