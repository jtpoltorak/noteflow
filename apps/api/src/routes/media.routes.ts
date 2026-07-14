import { Router, Request, Response, NextFunction } from "express";
import { optionalAuth } from "../middleware/auth.middleware.js";
import { resolveImagePath } from "../services/image.service.js";
import { resolveAudioPath } from "../services/audio.service.js";

const router = Router();

// UUID-named files only — defence-in-depth against path traversal
// (a :filename route param can never contain "/", but validate anyway).
const UUID_FILE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.\w+$/;

// `private` is critical: these responses are authorization-dependent, so a shared
// cache/CDN (Cloudflare) must never store one user's file and serve it to another.
const MEDIA_HEADERS = {
  "Cache-Control": "private, max-age=31536000, immutable",
  "X-Content-Type-Options": "nosniff",
  "Content-Disposition": "inline",
} as const;

function serveMedia(
  resolve: (filename: string, userId?: number) => string,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const filename = String(req.params.filename);
  if (!UUID_FILE_PATTERN.test(filename)) {
    res.status(400).json({ error: { message: "Invalid filename" } });
    return;
  }

  // Throws AppError (404 unknown file / 403 not authorized) — caught by Express.
  const filePath = resolve(filename, req.user?.id);

  // cacheControl:false stops `send` from overwriting our `private` header with `public`.
  res.sendFile(filePath, { cacheControl: false, headers: MEDIA_HEADERS }, (err) => {
    if (err && !res.headersSent) {
      next(err);
    }
  });
}

router.get("/images/:filename", optionalAuth, (req, res, next) => serveMedia(resolveImagePath, req, res, next));
router.get("/audio/:filename", optionalAuth, (req, res, next) => serveMedia(resolveAudioPath, req, res, next));

export default router;
