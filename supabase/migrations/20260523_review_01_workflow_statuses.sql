-- REVIEW-01: Add admin_reviewed_at to applications for tracking review dates
-- This column records when admin last took a review action (mark information needed or ready for contract)

ALTER TABLE applications
ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz;
