/*
  # Create NOKNOK Academy Database Schema

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `first_name` (text)
      - `paternal_surname` (text)
      - `maternal_surname` (text)
      - `birth_date` (date)
      - `curp` (text, unique)
      - `enrollment_number` (text, unique)
      - `enrollment_date` (date)
      - `current_level` (text)
      - `current_grade` (text)
      - `program` (text)
      - `shift` (text)
      - `representative` (text)
      - `status` (text: activo, pendiente, baja)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `tutors`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `name` (text)
      - `phone` (text)
      - `email` (text)
      - `created_at` (timestamp)
    
    - `documents`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `document_type` (text)
      - `file_name` (text)
      - `file_url` (text)
      - `uploaded_at` (timestamp)
    
    - `enrollments`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `enrollment_type` (text: anual, mensual)
      - `due_date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their academy data
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  paternal_surname text NOT NULL,
  maternal_surname text,
  birth_date date,
  curp text UNIQUE,
  enrollment_number text UNIQUE,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  current_level text,
  current_grade text,
  program text,
  shift text,
  representative text,
  status text DEFAULT 'activo' CHECK (status IN ('activo', 'pendiente', 'baja')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create tutors table
CREATE TABLE IF NOT EXISTS tutors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  email text,
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  enrollment_type text NOT NULL CHECK (enrollment_type IN ('anual', 'mensual')),
  due_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutors ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create policies for students
CREATE POLICY "Authenticated users can view students"
  ON students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert students"
  ON students FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update students"
  ON students FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete students"
  ON students FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for tutors
CREATE POLICY "Authenticated users can view tutors"
  ON tutors FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert tutors"
  ON tutors FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tutors"
  ON tutors FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tutors"
  ON tutors FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for enrollments
CREATE POLICY "Authenticated users can view enrollments"
  ON enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert enrollments"
  ON enrollments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrollments"
  ON enrollments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete enrollments"
  ON enrollments FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);
CREATE INDEX IF NOT EXISTS idx_tutors_student_id ON tutors(student_id);
CREATE INDEX IF NOT EXISTS idx_documents_student_id ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_due_date ON enrollments(due_date);