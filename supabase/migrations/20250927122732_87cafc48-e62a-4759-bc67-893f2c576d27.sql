-- Create clothing_items table for wardrobe functionality
CREATE TABLE public.clothing_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  color TEXT,
  season TEXT,
  occasion TEXT, -- Changed from tags to occasion as requested
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

-- Create outfits table for smart matches and outfit combinations
CREATE TABLE public.outfits (
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
CREATE TABLE public.outfit_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  outfit_id UUID NOT NULL REFERENCES public.outfits(id) ON DELETE CASCADE,
  clothing_item_id UUID NOT NULL REFERENCES public.clothing_items(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(outfit_id, clothing_item_id)
);

-- Enable Row Level Security
ALTER TABLE public.outfit_items ENABLE ROW LEVEL SECURITY;

-- Create policies for outfit_items based on user ownership of parent records
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

-- Create storage bucket for clothing item images
INSERT INTO storage.buckets (id, name, public) VALUES ('clothing-images', 'clothing-images', true);

-- Create storage policies for clothing images
CREATE POLICY "Users can view all clothing images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'clothing-images');

CREATE POLICY "Users can upload their own clothing images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own clothing images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own clothing images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'clothing-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create triggers for updated_at columns
CREATE TRIGGER update_clothing_items_updated_at
BEFORE UPDATE ON public.clothing_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_outfits_updated_at
BEFORE UPDATE ON public.outfits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();