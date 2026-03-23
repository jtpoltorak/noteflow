import cron from "node-cron";
import { purgeExpiredAccounts } from "../services/account-closure.service.js";
import { purgeExpiredItems } from "../services/recycle-bin.service.js";
import { cleanupExpiredTokens } from "../services/auth.service.js";

export function startAccountPurgeCron(): void {
  // Run daily at 3:00 AM UTC
  cron.schedule("0 3 * * *", () => {
    console.log("[cron] Running account purge job...");
    try {
      purgeExpiredAccounts();
    } catch (err) {
      console.error("[cron] Account purge failed:", err);
    }

    console.log("[cron] Running recycle bin purge job...");
    try {
      purgeExpiredItems();
    } catch (err) {
      console.error("[cron] Recycle bin purge failed:", err);
    }

    console.log("[cron] Running expired token cleanup...");
    try {
      cleanupExpiredTokens();
    } catch (err) {
      console.error("[cron] Token cleanup failed:", err);
    }
  });
  console.log("[cron] Daily maintenance scheduled (03:00 UTC)");
}
