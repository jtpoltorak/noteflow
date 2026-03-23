import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { initDatabase, runMigrations } from "./db/database.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import notebookRoutes from "./routes/notebook.routes.js";
import sectionRoutes from "./routes/section.routes.js";
import tagRoutes from "./routes/tag.routes.js";
import templateRoutes from "./routes/template.routes.js";
import noteRoutes from "./routes/note.routes.js";
import searchRoutes from "./routes/search.routes.js";
import shareRoutes from "./routes/share.routes.js";
import imageRoutes from "./routes/image.routes.js";
import audioRoutes from "./routes/audio.routes.js";
import recycleBinRoutes from "./routes/recycle-bin.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";
import { globalLimiter } from "./middleware/rate-limit.middleware.js";
import { ensureUploadDir, getUploadDir } from "./services/image.service.js";
import { startAccountPurgeCron } from "./cron/account-purge.cron.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ─────────────────────────────────────────
app.set("trust proxy", 1); // Trust first proxy (Railway, etc.)
app.use(
  cors({
    origin: [
      "https://mynoteflow.app",
      "http://localhost:4200",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", globalLimiter);

// ── Routes ────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({ data: { status: "ok" } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", shareRoutes);

// Serve uploaded images without auth (referenced by <img> tags in note content)
ensureUploadDir();
app.use("/api/v1/images", express.static(getUploadDir()));
app.use("/api/v1/audio", express.static(getUploadDir()));

app.use("/api/v1/notebooks", requireAuth, notebookRoutes);
app.use("/api/v1", requireAuth, sectionRoutes);
app.use("/api/v1", requireAuth, tagRoutes);
app.use("/api/v1", requireAuth, templateRoutes);
app.use("/api/v1", requireAuth, noteRoutes);
app.use("/api/v1", requireAuth, imageRoutes);
app.use("/api/v1", requireAuth, audioRoutes);
app.use("/api/v1/recycle-bin", requireAuth, recycleBinRoutes);
app.use("/api/v1/search", requireAuth, searchRoutes);

// ── Error handling (must be last) ─────────────────────────────
app.use(errorHandler);

// ── Start server ─────────────────────────────────────────────
async function start(): Promise<void> {
  await initDatabase();
  runMigrations();
  startAccountPurgeCron();

  app.listen(PORT, () => {
    console.log(`NoteFlow API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
