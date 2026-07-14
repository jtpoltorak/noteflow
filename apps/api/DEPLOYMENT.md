# NoteFlow API — Deployment Notes

## Database durability (READ THIS FIRST)

NoteFlow stores everything in a single SQLite file (`sql.js`) at `DB_PATH`.
Railway (and most container platforms) give each deploy an **ephemeral
filesystem** — anything written to it is **erased on every redeploy or
restart**. If `DB_PATH` points at the ephemeral filesystem, **all user data is
lost on the next deploy.**

### Required: mount a persistent volume

1. In the Railway service, add a **Volume** and mount it at `/data`.
2. Set the env var `DB_PATH=/data/noteflow.db`.

All writes (and the `backups/` directory) then live on the volume and survive
restarts and redeploys.

### Backups

- The API takes a backup automatically **before running migrations** on startup
  and **once daily at 03:00 UTC** (via the maintenance cron).
- Backups are written to `<dir of DB_PATH>/backups/noteflow-<timestamp>.db`.
- `DB_BACKUP_KEEP` (default `7`) controls how many are retained; older ones are
  pruned automatically.
- These backups live on the same volume — they protect against corruption,
  accidental deletion, and bad migrations, but **not** loss of the volume
  itself. For real disaster recovery, periodically copy a backup off-box
  (e.g. `railway run` + upload to object storage, or a scheduled export).

### Writes are atomic

`saveDb()` writes to `<DB_PATH>.tmp` then `rename()`s it over the target, so a
crash mid-write can never leave a half-written, corrupt database.

## Environment variables

Copy `.env.example` to `.env` and fill in real values. On startup the server
**validates the environment and refuses to boot** if:

- `JWT_SECRET` or `REFRESH_TOKEN_SECRET` is missing, shorter than 32 chars, or
  still set to a placeholder value, or
- the two secrets are identical.

Generate strong secrets with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Set `NODE_ENV=production` in production so secure cookies, HSTS, and the
HTTP→HTTPS redirect are enabled.
