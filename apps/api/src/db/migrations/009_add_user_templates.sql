CREATE TABLE IF NOT EXISTS UserTemplate (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  userId      INTEGER NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  content     TEXT NOT NULL DEFAULT '',
  category    TEXT NOT NULL DEFAULT 'Custom',
  createdAt   TEXT NOT NULL,
  updatedAt   TEXT NOT NULL
);
