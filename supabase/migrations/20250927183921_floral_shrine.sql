/*
  # VWardrobe Database Schema

  1. New Tables
    - `profiles` - User profile information with avatar support
    - `clothing_items` - Wardrobe items with usage tracking and wash management
    - `outfits` - Saved outfit combinations
    - `outfit_items` - Junction table for outfit-clothing relationships
    - `user_roles` - User role management

  2. Security
    - Enable RLS on all tables
    - Add comprehensive policies for user data isolation
    - Secure storage bucket policies for images

  3. Storage
    - Create secure buckets for clothing images and avatars
    - Implement proper access controls

  4. Functions
    - Add role checking function
    - Add updated_at trigger function
*/

-- Create enum for user roles
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create clothing_items table with proper usage tracking
CREATE TABLE IF NOT EXISTS public.clothing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT,
  season TEXT,
  occasion TEXT,
  max_uses INTEGER DEFAULT 10,
  current_uses INTEGER DEFAULT 0,
  in_wash BOOLEAN DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clothing_items ENABLE ROW LEVEL SECURITY;

-- Create policies for clothing_items
CREATE POLICY "Users can view their own items" 
ON public.clothing_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own items" 
ON public.clothing_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items" 
ON public.clothing_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items" 
ON public.clothing_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create outfits table
CREATE TABLE IF NOT EXISTS public.outfits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  occasion TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.outfits ENABLE ROW LEVEL SECURITY;

-- Create policies for outfits
CREATE POLICY "Users can view their own outfits" 
ON public.outfits 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own outfits" 
ON public.outfits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own outfits" 
ON public.outfits 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own outfits" 
ON public.outfits 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create outfit_items junction table
CREATE TABLE IF NOT EXISTS public.outfit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  clothing_item_id UUID NOT NULL REFERENCES public.clothing_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(outfit_id, clothing_item_id)
);

-- Enable Row Level Security
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;

-- Create policies for outfit_items
CREATE POLICY "Users can view outfit items for their outfits" 
ON public.outfit_items 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.outfits 
    WHERE outfits.id = outfit_items.outfit_id 
    AND outfits.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create outfit items for their outfits" 
ON public.outfit_items 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.outfits 
    WHERE outfits.id = outfit_items.outfit_id 
    AND outfits.user_id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM public.clothing_items 
    WHERE clothing_items.id = outfit_items.clothing_item_id 
    AND clothing_items.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete outfit items for their outfits" 
ON public.outfit_items 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.outfits 
    WHERE outfits.id = outfit_items.outfit_id 
    AND outfits.user_id = auth.uid()
  )
);

-- Create role checking function
CREATE OR REPLACE FUNCTION has_role(_role app_role, _user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('clothing-images', 'clothing-images', true),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for clothing images
CREATE POLICY "Anyone can view clothing images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'clothing-images');

CREATE POLICY "Users can upload their own clothing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'clothing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own clothing images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'clothing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own clothing images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'clothing-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create storage policies for avatars
CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clothing_items_updated_at
BEFORE UPDATE ON public.clothing_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outfits_updated_at
BEFORE UPDATE ON public.outfits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();