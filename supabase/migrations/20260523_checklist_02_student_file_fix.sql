-- CHECKLIST-02: Add not_applicable status to admission checklist constraints
-- This allows admin to mark checklist items as not applicable.

-- Drop existing constraints
ALTER TABLE public.admission_checklists
  DROP CONSTRAINT IF EXISTS checklist_file_status_check;

ALTER TABLE public.admission_checklists
  DROP CONSTRAINT IF EXISTS checklist_academic_status_check;

ALTER TABLE public.admission_checklists
  DROP CONSTRAINT IF EXISTS checklist_english_status_check;

-- Recreate with not_applicable addednp
ALTER TABLE public.admission_checklists
  ADD CONSTRAINT checklist_file_status_check CHECK (
    photo_id_status IN ('not_received', 'uploaded', 'accepted', 'needs_correction', 'not_applicable')
    AND address_proof_status IN ('not_received', 'uploaded', 'accepted', 'needs_correction', 'not_applicable')
  );

ALTER TABLE public.admission_checklists
  ADD CONSTRAINT checklist_academic_status_check CHECK (
    academic_status IN ('not_started', 'in_review', 'accepted', 'needs_correction', 'not_applicable')
  );

ALTER TABLE public.admission_checklists
  ADD CONSTRAINT checklist_english_status_check CHECK (
    english_status IN ('not_started', 'in_review', 'accepted', 'needs_correction', 'not_applicable')
  );
