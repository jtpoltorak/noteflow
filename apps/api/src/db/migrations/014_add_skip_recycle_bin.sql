-- Add user preference to skip recycle bin (permanently delete immediately)
ALTER TABLE User ADD COLUMN skipRecycleBin INTEGER NOT NULL DEFAULT 0;
