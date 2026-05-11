-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('workspace-assets', 'workspace-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Allow public access to read files
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT USING (bucket_id = 'workspace-assets');

-- 3. Allow authenticated users to upload files
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'workspace-assets' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow users to update/delete their own uploads (optional but recommended)
CREATE POLICY "Manage Own Uploads" ON storage.objects
FOR ALL USING (
  bucket_id = 'workspace-assets' 
  AND auth.uid() = owner
);
