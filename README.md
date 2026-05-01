# NOKNOK Academy

A simple academy management web application built with React, TypeScript, Vite and a REST API backend.

### Indexes and Constraints

- Unique constraints on fields like `curp`, `enrollment_number`, `code`, and `folio`.
- Foreign keys with `ON DELETE CASCADE` to maintain referential integrity.
- CHECK constraints on enumerated text fields (e.g., status and enrollment_type).
- Performance indexes on foreign key columns and common query fields.

## Setup Instructions

1. Clone repository and run `npm install` to install dependencies.
2. The backend API is deployed at `https://nok-nok-api.onrender.com/docs/api/v1`. The frontend connects to this API.
3. Create a `.env` file at the project root with the backend API base URL for requests:
   ```bash
   VITE_API_BASE_URL=https://nok-nok-api.onrender.com/docs/api/v1
   ```
4. Start development server:
   ```bash
   npm run dev
   ```
5. Open `http://localhost:5176` (or the port shown) and sign up/log in to start managing the academy.

## Technologies

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** REST API (deployed on Render)
- **Deployment:** Frontend static build, Backend on Render

---
