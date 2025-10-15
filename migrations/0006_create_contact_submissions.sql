-- Migration number: 0006
-- Create contact_submissions table for contact form entries (backup to KV)
DROP TABLE IF EXISTS contact_submissions;

CREATE TABLE contact_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
