import bcrypt from "bcryptjs";
import { getDb, saveDb } from "../db/database.js";
import { AppError } from "../middleware/error.middleware.js";
import { sendAccountClosureRequestedEmail, sendAccountDeletedEmail } from "./email.service.js";
import type { AccountClosureStatusDto } from "@noteflow/shared-types";

const GRACE_PERIOD_DAYS = 7;

function computeDeletionDate(deleteRequestedAt: string): string {
  const d = new Date(deleteRequestedAt);
  d.setDate(d.getDate() + GRACE_PERIOD_DAYS);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function requestAccountClosure(
  userId: number,
  password: string,
): AccountClosureStatusDto {
  const db = getDb();

  const result = db.exec(
    "SELECT email, passwordHash FROM User WHERE id = ?",
    [userId],
  );
  if (result.length === 0 || result[0].values.length === 0) {
    throw new AppError(404, "User not found", "NOT_FOUND");
  }

  const email = result[0].values[0][0] as string;
  const passwordHash = result[0].values[0][1] as string;

  const valid = bcrypt.compareSync(password, passwordHash);
  if (!valid) {
    throw new AppError(401, "Password is incorrect", "INVALID_PASSWORD");
  }

  const now = new Date().toISOString();
  db.run("UPDATE User SET deleteRequestedAt = ? WHERE id = ?", [now, userId]);
  saveDb();

  const deletionDate = computeDeletionDate(now);

  // Fire-and-forget email
  sendAccountClosureRequestedEmail(email, deletionDate).catch(() => {});

  return { deleteRequestedAt: now, deletionDate };
}

export function reactivateAccount(userId: number): void {
  const db = getDb();
  db.run("UPDATE User SET deleteRequestedAt = NULL WHERE id = ?", [userId]);
  saveDb();
}

export function purgeExpiredAccounts(): void {
  const db = getDb();

  const cutoff = new Date(
    Date.now() - GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const result = db.exec(
    "SELECT id, email FROM User WHERE deleteRequestedAt IS NOT NULL AND deleteRequestedAt <= ?",
    [cutoff],
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return;
  }

  const rows = result[0].values;
  console.log(`[cron] Purging ${rows.length} expired account(s)...`);

  for (const row of rows) {
    const id = row[0] as number;
    const email = row[1] as string;

    // Cascade deletes handle Notebooks -> Sections -> Notes, etc.
    db.run("DELETE FROM User WHERE id = ?", [id]);
    console.log(`[cron] Deleted account id=${id} (${email})`);

    // Fire-and-forget final email
    sendAccountDeletedEmail(email).catch(() => {});
  }

  saveDb();
}
