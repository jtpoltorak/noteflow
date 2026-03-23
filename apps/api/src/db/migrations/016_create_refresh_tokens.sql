CREATE TABLE IF NOT EXISTS RefreshToken (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  userId    INTEGER NOT NULL REFERENCES User(id) ON DELETE CASCADE,
  tokenHash TEXT    NOT NULL,
  family    TEXT    NOT NULL,
  expiresAt TEXT    NOT NULL,
  revokedAt TEXT,
  createdAt TEXT    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refresh_token_hash ON RefreshToken(tokenHash);
CREATE INDEX IF NOT EXISTS idx_refresh_token_family ON RefreshToken(family);
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON RefreshToken(userId);
