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
import noteRoutes from "./routes/note.routes.js";
import searchRoutes from "./routes/search.routes.js";
import shareRoutes from "./routes/share.routes.js";
import { requireAuth } from "./middleware/auth.middleware.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ── Global middleware ─────────────────────────────────────────
app.use(
  cors({
    origin: [
      "https://web-production-ea3c8.up.railway.app",
      "http://localhost:4200",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────
app.get("/api/v1/health", (_req, res) => {
  res.json({ data: { status: "ok" } });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1", shareRoutes);

app.use("/api/v1/notebooks", requireAuth, notebookRoutes);
app.use("/api/v1", requireAuth, sectionRoutes);
app.use("/api/v1", requireAuth, tagRoutes);
app.use("/api/v1", requireAuth, noteRoutes);
app.use("/api/v1/search", requireAuth, searchRoutes);

// ── Error handling (must be last) ─────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
async function start(): Promise<void> {
  await initDatabase();
  runMigrations();

  app.listen(PORT, () => {
    console.log(`NoteFlow API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

export default app;
