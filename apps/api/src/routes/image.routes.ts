import { Router, Request, Response } from "express";
import multer from "multer";
import { uploadImage } from "../services/image.service.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// POST /notes/:noteId/images
router.post(
  "/notes/:noteId/images",
  upload.single("image"),
  (req: Request, res: Response) => {
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
  }
);

export default router;
