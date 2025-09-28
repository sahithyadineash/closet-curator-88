-- Create avatar_preferences table for storing user avatar customizations
CREATE TABLE public.avatar_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  skin_tone VARCHAR(50) DEFAULT 'medium',
  hair_color VARCHAR(50) DEFAULT 'brown',
  body_type VARCHAR(50) DEFAULT 'average',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.avatar_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for avatar preferences
CREATE POLICY "Users can view their own avatar preferences" 
ON public.avatar_preferences 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own avatar preferences" 
ON public.avatar_preferences 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own avatar preferences" 
ON public.avatar_preferences 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_avatar_preferences_updated_at
BEFORE UPDATE ON public.avatar_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();