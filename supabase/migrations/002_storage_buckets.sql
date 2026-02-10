-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('user-uploads', 'user-uploads', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('generated-thumbnails', 'generated-thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for user-uploads bucket
CREATE POLICY "Users can upload own images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-uploads' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS Policies for generated-thumbnails bucket
CREATE POLICY "Users can view own thumbnails"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'generated-thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "System can insert thumbnails"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-thumbnails');

CREATE POLICY "Users can delete own thumbnails"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'generated-thumbnails' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
