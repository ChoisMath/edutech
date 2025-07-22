-- Add sort_order column to edutech_cards table
-- This migration adds the sort_order field for drag-and-drop card reordering

-- Add the sort_order column
ALTER TABLE edutech_cards 
ADD COLUMN sort_order INTEGER;

-- Set initial sort_order values based on created_at (older cards get lower numbers)
UPDATE edutech_cards 
SET sort_order = (
    SELECT ROW_NUMBER() OVER (ORDER BY created_at ASC)
    FROM edutech_cards AS ec2 
    WHERE ec2.id = edutech_cards.id
);

-- Create index for better performance
CREATE INDEX idx_edutech_cards_sort_order ON edutech_cards(sort_order);

-- Make sort_order NOT NULL with default value
ALTER TABLE edutech_cards 
ALTER COLUMN sort_order SET NOT NULL;

-- Set default value for future inserts
ALTER TABLE edutech_cards 
ALTER COLUMN sort_order SET DEFAULT 1;