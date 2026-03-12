import cron from "node-cron";
import { purgeExpiredAccounts } from "../services/account-closure.service.js";

export function startAccountPurgeCron(): void {
  // Run daily at 3:00 AM UTC
  cron.schedule("0 3 * * *", () => {
    console.log("[cron] Running account purge job...");
    try {
      purgeExpiredAccounts();
    } catch (err) {
      console.error("[cron] Account purge failed:", err);
    }
  });
  console.log("[cron] Account purge scheduled (daily at 03:00 UTC)");
}
