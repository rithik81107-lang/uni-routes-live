
CREATE POLICY "Students read own note files" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students upload own note files" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Students delete own note files" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'notes' AND auth.uid()::text = (storage.foldername(name))[1]);
