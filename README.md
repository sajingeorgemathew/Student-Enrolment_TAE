# Student Enrolment — Toronto Academy of Education

Internal admin tool for managing student enrolment, intake batches, fee tracking, document collection, and contract generation at Toronto Academy of Education.

## Source of Truth

**Supabase (Postgres)** is the single source of truth for all operational data. The database schema lives in `supabase/migrations/`. TypeScript types in `src/types/` are derived from the schema. When in doubt, the migration files win.

**Excel is legacy/import/reference only.** The master class list spreadsheet is used for past data, historical reference, and occasional exports. It is not the system of record.

## Source Reference Files

Original source material (contract template, master class list) lives in `_reference/source-files/`. These are local-only references used to understand the contract structure and student/batch workflow. They are gitignored and **must not be committed** — they contain real student data.

## Contract and Signature

Contract generation is part of the roadmap. Adobe Sign and DocuSign integration comes later. The initial workflow supports manual signed PDF upload and wet signature tracking.

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
