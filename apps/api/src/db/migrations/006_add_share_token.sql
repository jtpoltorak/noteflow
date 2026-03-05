ALTER TABLE Note ADD COLUMN shareToken TEXT;
CREATE UNIQUE INDEX idx_note_share_token ON Note(shareToken);
