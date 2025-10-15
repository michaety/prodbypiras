-- Migration number: 0004
-- Create shop_listings table for music producer products
DROP TABLE IF EXISTS shop_listings;

CREATE TABLE shop_listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'stems', 'samples', 'beats', 'pack'
    length VARCHAR(50), -- e.g., "3:45" or "10 tracks"
    bpm INTEGER,
    key VARCHAR(10), -- e.g., "Am", "G Major"
    image_url TEXT, -- URL to R2 bucket
    preview_audio_url TEXT, -- URL to preview audio in R2
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stripe_price_id VARCHAR(255), -- Stripe price ID for checkout
    description TEXT,
    featured BOOLEAN DEFAULT 0, -- Show on portfolio page
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_shop_listings_updated_at 
    AFTER UPDATE ON shop_listings
    BEGIN
        UPDATE shop_listings 
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.id;
    END;
