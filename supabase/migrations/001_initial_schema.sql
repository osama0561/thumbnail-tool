-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Profiles Table (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  quota_remaining INTEGER DEFAULT 5,
  total_used INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'free',
  api_cost_total DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_tier CHECK (tier IN ('free', 'pro', 'enterprise'))
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Uploaded Images Table
CREATE TABLE public.uploaded_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  quality_score DECIMAL(3,2),
  is_selected BOOLEAN DEFAULT FALSE,
  analysis_notes JSONB,
  upload_batch_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_quality_score CHECK (quality_score >= 0 AND quality_score <= 1),
  CONSTRAINT check_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp'))
);

CREATE INDEX idx_uploaded_images_user_id ON public.uploaded_images(user_id);
CREATE INDEX idx_uploaded_images_batch_id ON public.uploaded_images(upload_batch_id);
CREATE INDEX idx_uploaded_images_selected ON public.uploaded_images(user_id, is_selected);

-- Enable RLS
ALTER TABLE public.uploaded_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for uploaded_images
CREATE POLICY "Users can view own images"
  ON public.uploaded_images FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON public.uploaded_images FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON public.uploaded_images FOR DELETE
  USING (auth.uid() = user_id);

-- Thumbnail Concepts Table
CREATE TABLE public.thumbnail_concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  video_title TEXT NOT NULL,
  concept_number INTEGER NOT NULL,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  emotion TEXT NOT NULL,
  expression TEXT NOT NULL,
  pose TEXT,
  scene TEXT,
  background TEXT,
  arabic_text TEXT NOT NULL,
  text_position TEXT,
  text_style TEXT,
  why_it_works TEXT,
  session_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_concept_number CHECK (concept_number >= 1 AND concept_number <= 10)
);

CREATE INDEX idx_concepts_user_session ON public.thumbnail_concepts(user_id, session_id);

-- Enable RLS
ALTER TABLE public.thumbnail_concepts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for thumbnail_concepts
CREATE POLICY "Users can view own concepts"
  ON public.thumbnail_concepts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concepts"
  ON public.thumbnail_concepts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Generation Queue Table
CREATE TABLE public.generation_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.thumbnail_concepts(id) ON DELETE CASCADE,
  reference_image_ids UUID[] NOT NULL,
  quality_mode TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  estimated_cost DECIMAL(6,4),
  actual_cost DECIMAL(6,4),
  thumbnail_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT check_status CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  CONSTRAINT check_quality_mode CHECK (quality_mode IN ('fast', 'hd')),
  CONSTRAINT check_progress CHECK (progress >= 0 AND progress <= 100)
);

CREATE INDEX idx_queue_status ON public.generation_queue(status, created_at);
CREATE INDEX idx_queue_user_status ON public.generation_queue(user_id, status);

-- Enable RLS
ALTER TABLE public.generation_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generation_queue
CREATE POLICY "Users can view own queue jobs"
  ON public.generation_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own queue jobs"
  ON public.generation_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own queue jobs"
  ON public.generation_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Generated Thumbnails Table
CREATE TABLE public.generated_thumbnails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES public.thumbnail_concepts(id),
  queue_job_id UUID REFERENCES public.generation_queue(id),
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  quality_mode TEXT NOT NULL,
  model_used TEXT NOT NULL,
  generation_time_ms INTEGER,
  cost DECIMAL(6,4),
  download_count INTEGER DEFAULT 0,
  is_favorited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_quality_mode CHECK (quality_mode IN ('fast', 'hd'))
);

CREATE INDEX idx_thumbnails_user_id ON public.generated_thumbnails(user_id, created_at DESC);
CREATE INDEX idx_thumbnails_concept_id ON public.generated_thumbnails(concept_id);

-- Enable RLS
ALTER TABLE public.generated_thumbnails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for generated_thumbnails
CREATE POLICY "Users can view own thumbnails"
  ON public.generated_thumbnails FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own thumbnails"
  ON public.generated_thumbnails FOR UPDATE
  USING (auth.uid() = user_id);

-- Usage Logs Table
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  resource_id UUID,
  api_cost DECIMAL(6,4),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_action_type CHECK (action_type IN ('image_upload', 'image_analysis', 'concept_generation', 'thumbnail_generation'))
);

CREATE INDEX idx_usage_logs_user_date ON public.usage_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for usage_logs
CREATE POLICY "Users can view own logs"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'display_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
