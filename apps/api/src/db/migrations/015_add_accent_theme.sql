-- Add user preference for accent color theme
ALTER TABLE User ADD COLUMN accentTheme TEXT NOT NULL DEFAULT 'ocean';
