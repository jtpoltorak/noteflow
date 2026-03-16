-- Add soft-delete support (deletedAt timestamp) to Notebook, Section, and Note
ALTER TABLE Notebook ADD COLUMN deletedAt TEXT DEFAULT NULL;
ALTER TABLE Section ADD COLUMN deletedAt TEXT DEFAULT NULL;
ALTER TABLE Note ADD COLUMN deletedAt TEXT DEFAULT NULL;
