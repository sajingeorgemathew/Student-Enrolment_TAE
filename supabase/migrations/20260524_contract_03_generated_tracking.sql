-- CONTRACT-03: Add contract_generated_at to applications for tracking
-- when the Word contract was last generated.

ALTER TABLE public.applications
ADD COLUMN IF NOT EXISTS contract_generated_at timestamptz;
