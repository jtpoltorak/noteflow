CREATE TABLE IF NOT EXISTS Audio (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  noteId      INTEGER NOT NULL REFERENCES Note(id) ON DELETE CASCADE,
  filename    TEXT    NOT NULL UNIQUE,
  originalName TEXT   NOT NULL,
  mimeType    TEXT    NOT NULL,
  size        INTEGER NOT NULL,
  createdAt   TEXT    NOT NULL
);
