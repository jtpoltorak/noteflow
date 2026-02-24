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

/** Persist the in-memory database to disk. Call after any write operation. */
export function saveDb(): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
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
