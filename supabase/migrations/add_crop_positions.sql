-- Add crop_positions column to pieces table
-- Stores per-photo crop offsets as { "0": { x: 50, y: 50 }, "1": { x: 30, y: 20 } }
-- x and y are percentages (0–100) mapping to CSS object-position
ALTER TABLE pieces ADD COLUMN IF NOT EXISTS crop_positions jsonb DEFAULT '{}';
