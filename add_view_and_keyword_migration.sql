-- Add missing fields to edutech_cards table
-- This migration adds the view and keyword fields that are used in the application but missing from the schema

-- Add the view column (for admin approval workflow)
ALTER TABLE edutech_cards 
ADD COLUMN IF NOT EXISTS view INTEGER DEFAULT 1;

-- Add the keyword column (for user-defined keywords, separate from ai_keywords)
ALTER TABLE edutech_cards 
ADD COLUMN IF NOT EXISTS keyword TEXT[];

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_edutech_cards_view ON edutech_cards(view);
CREATE INDEX IF NOT EXISTS idx_edutech_cards_keyword ON edutech_cards USING GIN(keyword);

-- Update existing records to have view=1 (visible) if not set
UPDATE edutech_cards 
SET view = 1 
WHERE view IS NULL;