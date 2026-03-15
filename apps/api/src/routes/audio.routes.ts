import { Router, Request, Response, NextFunction } from "express";
import multer, { MulterError } from "multer";
import { uploadAudio } from "../services/audio.service.js";

const router = Router();

const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25 MB (WAV files are large)

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_SIZE },
});

// POST /notes/:noteId/audio
router.post(
  "/notes/:noteId/audio",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("audio")(req, res, (err) => {
      if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: { message: "File too large. Maximum size is 25 MB" } });
        return;
      }
      if (err) {
        next(err);
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: { message: "No audio file provided" } });
        return;
      }

      const audio = uploadAudio(
        Number(req.params.noteId),
        req.user!.id,
        req.file
      );
      res.status(201).json({ data: audio });
    });
  }
);

export default router;
