# Student Enrolment Application

Internal admin tool for managing student enrolment, intake batches, fee tracking, document collection, and contract generation.

## Source of Truth

The **database schema** (Supabase/Postgres migrations in `supabase/migrations/`) is the single source of truth for data structure. TypeScript types in `src/types/` are derived from the schema. When in doubt, the migration files win.

## Source Reference Files

Original source material and environment templates live in `_reference/source-files/`. These are not used at runtime — they exist solely as a reference for rebuilding or auditing the project setup.

## Environment Setup

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
2. Fill in the values for Supabase, Resend, and contract branding URLs.
3. Never commit `.env.local` — it is gitignored.

## Local Commands

```bash
npm run dev    # Start development server (http://localhost:3000)
npm run build  # Production build
npm run start  # Start production server
npm run lint   # Run ESLint
```

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database:** Supabase (Postgres)
- **Email:** Resend
- **Styling:** Tailwind CSS 4
- **Forms:** react-hook-form + zod
- **UI:** lucide-react icons, clsx + tailwind-merge utilities
