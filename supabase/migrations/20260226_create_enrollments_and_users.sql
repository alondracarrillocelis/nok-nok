-- Create users/representatives table if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  role TEXT DEFAULT 'representante',
  status TEXT DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create enrollments table with required fields
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  folio TEXT UNIQUE,
  enrollment_date DATE NOT NULL,
  enrollment_type TEXT NOT NULL CHECK (enrollment_type IN ('semanal', 'trimestral', 'anual')),
  program TEXT,
  representative_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'activo',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Allow authenticated users to view users"
  ON public.users FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert users"
  ON public.users FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for enrollments
CREATE POLICY "Allow authenticated users to view enrollments"
  ON public.enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to manage enrollments"
  ON public.enrollments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update enrollments"
  ON public.enrollments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
