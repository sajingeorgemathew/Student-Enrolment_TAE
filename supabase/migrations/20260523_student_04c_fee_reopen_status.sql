-- STUDENT-04C: Add reopened status to fee_schedules for correction workflow
-- Admin/super_admin can reopen an approved fee schedule for correction.
-- Reopened fee schedules can be edited and re-approved.

ALTER TABLE public.fee_schedules
  DROP CONSTRAINT IF EXISTS fee_schedules_status_check;

ALTER TABLE public.fee_schedules
  ADD CONSTRAINT fee_schedules_status_check CHECK (
    status IN ('draft', 'admin_review', 'approved', 'reopened', 'archived')
  );
