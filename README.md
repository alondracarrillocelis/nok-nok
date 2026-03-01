# NOKNOK Academy

A simple academy management web application built with React, TypeScript, Vite and Supabase.

## 🎯 Functional Overview

The application allows authenticated users to manage academy data, including:

1. **Authentication & Authorization**
   - Supabase handles user sign-up/sign-in.
   - Users have roles (`admin`, `tutor`, `representante`) to control access.
   - Protected routes ensure only logged-in users can view the dashboard.

2. **Student Management**
   - Create, read, update, and delete student records.
   - Track personal details, enrollment information, academic program, and status.
   - Upload and manage related documents (identification, payments, etc.).
   - Assign tutors/representatives to each student.
   - View and edit medical ailments associated with a student.

3. **Tutor & Representative Management**
   - A separate table for tutors linked to students.
   - Basic contact information stored and editable.

4. **Enrollment Tracking**
   - Record different types of enrollments (anual, mensual, semanal, trimestral).
   - Track due dates, programs, and representative relationships.
   - Enrollment status management (activo, pendiente, baja).

5. **Subject Catalog**
   - Maintain a list of subjects with codes, descriptions, credits, and status.
   - Assign subjects to students with grades and completion status.

6. **Medical Ailments**
   - Global list of ailments and per-student associations.
   - Store severity, medication, diagnosis dates, and notes.

7. **User Administration**
   - Admins can manage application users (other tutors/administrators).
   - User profile includes name, email, phone and role.
   - Status field to activate/deactivate users.

8. **File Uploads**
   - Drag-and-drop upload component for student documents.
   - Files are stored in Supabase storage and referenced via URL.

9. **Interface Components**
   - Modals for adding/editing students, subjects, and users.
   - Drag/drop upload, confirmations, and toast notifications.
   - Protected routes with layout and role-based rendering.

## 🗄️ Database Structure

All tables use **UUID** primary keys and have Row Level Security (RLS) enabled with permissive policies for authenticated users. The main schema objects are:

### Core Tables

| Table              | Description                                                                 | Key Columns                                                          |
|--------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------------|
| `students`         | Stores student personal and academic information.                          | `id`, `first_name`, `curp`, `enrollment_number`, `status`, ...       |
| `tutors`           | Contact persons linked to a student.                                       | `id`, `student_id`, `name`, `phone`, `email`                         |
| `documents`        | Uploaded files associated with students.                                   | `id`, `student_id`, `document_type`, `file_url`                      |
| `enrollments`      | Enrollment records (various types).                                        | `id`, `student_id`, `enrollment_type`, `due_date`, `program`, ...    |
| `users`            | Application users mapped to `auth.users`.                                  | `id`, `user_id`, `first_name`, `email`, `role`, `status`            |

### Academic Tables

| Table              | Description                                                                 | Key Columns                                                          |
|--------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------------|
| `subjects`         | Catalog of study subjects.                                                  | `id`, `name`, `code`, `credits`, `status`                           |
| `student_subjects` | Junction table linking students to subjects with grades/status.             | `id`, `student_id`, `subject_id`, `grade`, `status`                 |

### Medical Tables

| Table              | Description                                                                 | Key Columns                                                          |
|--------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------------|
| `ailments`         | List of possible medical conditions.                                       | `id`, `name`, `description`, `severity`                             |
| `student_ailments` | Association between students and ailments with diagnosis details.          | `id`, `student_id`, `ailment_id`, `diagnosis_date`, `status`        |

### Additional Tables

| Table              | Description                                                                 | Key Columns                                                          |
|--------------------|-----------------------------------------------------------------------------|----------------------------------------------------------------------|
| `users` (legacy)   | Alternate users/representatives table used by earlier migrations.          | `id`, `name`, `email`, `role`, `status`                             |

> **Note:** Some migrations create overlapping or extended versions of the same tables (`enrollments`, `users`). The final schema contains all fields from each migration, but duplicates are avoided using `IF NOT EXISTS` and unique constraints.

### Indexes and Constraints

- Unique constraints on fields like `curp`, `enrollment_number`, `code`, and `folio`.
- Foreign keys with `ON DELETE CASCADE` to maintain referential integrity.
- CHECK constraints on enumerated text fields (e.g., status and enrollment_type).
- Performance indexes on foreign key columns and common query fields.

## 🔧 Setup Instructions

1. Clone repository and run `npm install` to install dependencies.
2. Create a Supabase project and copy the `supabaseUrl`/`supabaseKey` into `src/lib/supabase.ts`.
3. Run the SQL migrations located in `supabase/migrations/` or use the Supabase CLI.
4. Start development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:3000` and sign up/log in to start managing the academy.

## 📦 Technologies

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend / Database:** Supabase (PostgreSQL, Auth, Storage)
- **Deployment:** Hosted with Supabase and Vite static build

---

This README provides an overview of the system's functionality and the structure of the underlying database schema. Feel free to expand sections with additional developer notes, deployment steps, or contribution guidelines as needed.