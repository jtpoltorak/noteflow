import { Router, Request, Response, NextFunction } from "express";
import multer, { MulterError } from "multer";
import { uploadImage } from "../services/image.service.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /notes/:noteId/images
router.post(
  "/notes/:noteId/images",
  (req: Request, res: Response, next: NextFunction) => {
    upload.single("image")(req, res, (err) => {
      if (err instanceof MulterError && err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ error: { message: "File too large. Maximum size is 5 MB" } });
        return;
      }
      if (err) {
        next(err);
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: { message: "No image file provided" } });
        return;
      }

      const image = uploadImage(
        Number(req.params.noteId),
        req.user!.id,
        req.file
      );
      res.status(201).json({ data: image });
    });
  }
);

export default router;
