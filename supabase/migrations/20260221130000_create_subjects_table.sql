/*
  # Add Subjects and Student-Subjects Tables

  1. New Tables
    - `subjects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `code` (text, unique)
      - `description` (text)
      - `credits` (integer)
      - `status` (text: activo, inactivo)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `student_subjects`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `subject_id` (uuid, foreign key)
      - `grade` (numeric)
      - `status` (text: active, completed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  credits integer DEFAULT 3,
  status text DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create student_subjects junction table
CREATE TABLE IF NOT EXISTS student_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  grade numeric,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Enable Row Level Security
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_subjects ENABLE ROW LEVEL SECURITY;

-- Create policies for subjects
CREATE POLICY "Authenticated users can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update subjects"
  ON subjects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete subjects"
  ON subjects FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for student_subjects
CREATE POLICY "Authenticated users can view student_subjects"
  ON student_subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert student_subjects"
  ON student_subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update student_subjects"
  ON student_subjects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete student_subjects"
  ON student_subjects FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_subjects_code ON subjects(code);
CREATE INDEX IF NOT EXISTS idx_subjects_status ON subjects(status);
CREATE INDEX IF NOT EXISTS idx_student_subjects_student_id ON student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject_id ON student_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_status ON student_subjects(status);
