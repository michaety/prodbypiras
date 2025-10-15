-- Migration number: 0005
-- Create tracks table for individual tracks in a listing/pack
DROP TABLE IF EXISTS tracks;

CREATE TABLE tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    length VARCHAR(50), -- e.g., "3:45"
    bpm INTEGER,
    key VARCHAR(10), -- e.g., "Am", "G Major"
    audio_url TEXT, -- URL to audio file in R2
    track_order INTEGER DEFAULT 0, -- Order within the listing
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (listing_id) REFERENCES shop_listings(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_tracks_listing_id ON tracks(listing_id);
