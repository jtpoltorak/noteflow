import initSqlJs, { Database } from "sql.js";
import path from "path";
import fs from "fs";

const DB_PATH = process.env.DB_PATH || "./data/noteflow.db";

let db: Database;

/** Call once at startup before handling requests. */
export async function initDatabase(): Promise<void> {
  const SQL = await initSqlJs();

  // Ensure the directory for the DB file exists
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing DB from disk, or create a new one
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Enforce foreign key constraints
  db.run("PRAGMA foreign_keys = ON;");
}

/** Get the database instance. Throws if called before initDatabase(). */
export function getDb(): Database {
  if (!db) {
    throw new Error("Database not initialised. Call initDatabase() first.");
  }
  return db;
}

/**
 * Persist the in-memory database to disk. Call after any write operation.
 *
 * Writes to a temp file then renames over the target. rename() is atomic on the
 * same filesystem, so a crash mid-write can never leave a half-written (corrupt)
 * database file — readers see either the old file or the complete new one.
 */
export function saveDb(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  const tmpPath = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmpPath, buffer);
  fs.renameSync(tmpPath, DB_PATH);
}

/**
 * Copy the current database file into a timestamped backup, keeping only the
 * most recent DB_BACKUP_KEEP copies (default 7). No-op if the DB file does not
 * yet exist. Backups only survive restarts when DB_PATH lives on a persistent
 * volume — see apps/api/DEPLOYMENT.md.
 */
export function backupDatabase(): void {
  if (!fs.existsSync(DB_PATH)) return;

  const keep = Number(process.env.DB_BACKUP_KEEP) || 7;
  const dir = path.dirname(DB_PATH);
  const backupsDir = path.join(dir, "backups");
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const base = path.basename(DB_PATH, path.extname(DB_PATH));
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  fs.copyFileSync(DB_PATH, path.join(backupsDir, `${base}-${stamp}.db`));

  // ISO timestamps sort lexically, so oldest-first — prune all but the newest `keep`.
  const backups = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith(`${base}-`) && f.endsWith(".db"))
    .sort();
  for (let i = 0; i < backups.length - keep; i++) {
    fs.unlinkSync(path.join(backupsDir, backups[i]));
  }
}

/** Run migrations from the migrations directory. */
export function runMigrations(): void {
  // Create a migrations tracking table
  db.run(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      filename  TEXT UNIQUE NOT NULL,
      appliedAt TEXT NOT NULL
    );
  `);

  const migrationsDir = path.join(__dirname, "migrations");
  if (!fs.existsSync(migrationsDir)) {
    console.log("No migrations directory found, skipping.");
    return;
  }

  const applied = new Set<string>();
  const result = db.exec("SELECT filename FROM _migrations");
  if (result.length > 0) {
    for (const row of result[0].values) {
      applied.add(row[0] as string);
    }
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let ranAny = false;
  for (const file of files) {
    if (applied.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf-8");
    console.log(`Running migration: ${file}`);

    db.run(sql);
    db.run("INSERT INTO _migrations (filename, appliedAt) VALUES (?, ?)", [
      file,
      new Date().toISOString(),
    ]);
    ranAny = true;
  }

  if (ranAny) {
    saveDb();
  }
}
