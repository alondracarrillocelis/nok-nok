/*
  # Create Ailments (Padecimientos) Table

  1. New Tables
    - `ailments`
      - `id` (uuid, primary key)
      - `name` (text) - nombre del padecimiento
      - `description` (text) - descripción general
      - `medication` (text) - medicamento recomendado
      - `medical_description` (text) - descripción médica detallada
      - `severity` (text: leve, moderado, severo)
      - `notes` (text) - notas adicionales
      - `created_at` (timestamp)

    - `student_ailments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `ailment_id` (uuid, foreign key to ailments)
      - `status` (text: active, inactive)
      - `diagnosis_date` (date)
      - `notes` (text) - notas específicas del alumno
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
*/

-- Create ailments table
CREATE TABLE IF NOT EXISTS public.ailments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  medication TEXT,
  medical_description TEXT,
  severity TEXT DEFAULT 'moderado',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create student_ailments relationship table
CREATE TABLE IF NOT EXISTS public.student_ailments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  ailment_id UUID NOT NULL REFERENCES public.ailments(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active',
  diagnosis_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, ailment_id)
);

-- Enable RLS
ALTER TABLE public.ailments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_ailments ENABLE ROW LEVEL SECURITY;

-- Create policies for ailments
CREATE POLICY "Allow authenticated users to view ailments"
  ON public.ailments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert ailments"
  ON public.ailments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policies for student_ailments
CREATE POLICY "Allow authenticated users to view student ailments"
  ON public.student_ailments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert student ailments"
  ON public.student_ailments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update student ailments"
  ON public.student_ailments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete student ailments"
  ON public.student_ailments FOR DELETE
  TO authenticated
  USING (true);
