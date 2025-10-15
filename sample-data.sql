-- Sample data for testing the music producer portfolio
-- Run these after migrations to populate with example data

-- Insert sample shop listings
INSERT INTO shop_listings (title, type, length, bpm, key, price, description, featured) VALUES
  ('Dark Trap Beat', 'beats', '3:45', 140, 'Am', 29.99, 'Hard hitting trap beat with dark atmospheric vibes. Perfect for rap and hip-hop.', 1),
  ('Lo-Fi Sample Pack Vol. 1', 'samples', '50 samples', NULL, NULL, 19.99, 'Collection of 50 lo-fi samples including drums, melodies, and textures.', 1),
  ('Drill Kit 2024', 'pack', '100+ sounds', NULL, NULL, 24.99, 'Complete drill production kit with 808s, hi-hats, snares, and melodic loops.', 1),
  ('Melodic Trap Beat', 'beats', '3:12', 150, 'F#m', 34.99, 'Melodic trap beat with emotional piano and hard-hitting drums.', 0),
  ('R&B Stems Pack', 'stems', '5 tracks', 85, 'Cmaj', 49.99, 'Professional R&B track stems ready for mixing and mastering.', 1),
  ('Ambient Textures', 'samples', '30 samples', NULL, NULL, 15.99, 'Atmospheric ambient textures and pads for any genre.', 0);

-- Insert sample tracks for "Dark Trap Beat" (listing_id: 1)
INSERT INTO tracks (listing_id, title, length, bpm, key, track_order) VALUES
  (1, 'Main Mix', '3:45', 140, 'Am', 1),
  (1, 'No Drums', '3:45', 140, 'Am', 2),
  (1, 'Stems', '3:45', 140, 'Am', 3);

-- Insert sample tracks for "Lo-Fi Sample Pack Vol. 1" (listing_id: 2)
INSERT INTO tracks (listing_id, title, length, bpm, key, track_order) VALUES
  (2, 'Drums 01', '0:08', 90, NULL, 1),
  (2, 'Drums 02', '0:08', 85, NULL, 2),
  (2, 'Melody 01', '0:16', 90, 'Cmaj', 3),
  (2, 'Melody 02', '0:16', 95, 'Gmaj', 4),
  (2, 'Bass 01', '0:08', 90, 'C', 5);

-- Insert sample tracks for "R&B Stems Pack" (listing_id: 5)
INSERT INTO tracks (listing_id, title, length, bpm, key, track_order) VALUES
  (5, 'Vibe Check - Full Mix', '3:30', 85, 'Cmaj', 1),
  (5, 'Vibe Check - Vocals', '3:30', 85, 'Cmaj', 2),
  (5, 'Vibe Check - Instrumental', '3:30', 85, 'Cmaj', 3),
  (5, 'Vibe Check - Drums', '3:30', 85, 'Cmaj', 4),
  (5, 'Vibe Check - Bass', '3:30', 85, 'Cmaj', 5);

-- Sample contact submission (for testing)
INSERT INTO contact_submissions (name, email, message) VALUES
  ('John Doe', 'john@example.com', 'Hey! Love your beats. Would like to collaborate on a project.');

-- Notes for production:
-- 1. Update image_url fields with actual R2 URLs after uploading images
-- 2. Update preview_audio_url and audio_url fields with R2 URLs after uploading audio
-- 3. Update stripe_price_id fields after creating Stripe products
-- 4. Adjust prices based on your actual pricing strategy

-- Example update query for adding R2 URLs (run after uploading files):
-- UPDATE shop_listings 
-- SET image_url = 'https://piras-uploads.your-account.r2.cloudflarestorage.com/dark-trap-cover.jpg',
--     preview_audio_url = 'https://piras-uploads.your-account.r2.cloudflarestorage.com/dark-trap-preview.mp3'
-- WHERE id = 1;
