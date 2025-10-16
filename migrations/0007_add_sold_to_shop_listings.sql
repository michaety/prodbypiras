-- Migration number: 0007
-- Add sold column to shop_listings table for webhook updates
ALTER TABLE shop_listings ADD COLUMN sold BOOLEAN DEFAULT 0;
