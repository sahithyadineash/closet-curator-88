-- Add missing columns to clothing_items table for wash functionality
ALTER TABLE public.clothing_items 
ADD COLUMN current_uses INTEGER DEFAULT 0,
ADD COLUMN max_uses INTEGER DEFAULT 10,
ADD COLUMN in_wash BOOLEAN DEFAULT false;