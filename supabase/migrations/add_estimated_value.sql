-- Add optional estimated value (in whole dollars) to pieces.
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS estimated_value integer;
