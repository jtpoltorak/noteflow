import { Router, Request, Response } from "express";
import { getNoteByShareToken } from "../services/note.service.js";

const router = Router();

// GET /shared/:token (public — no auth required)
router.get("/shared/:token", (req: Request<{ token: string }>, res: Response) => {
  const note = getNoteByShareToken(req.params.token);
  res.json({ data: note });
});

export default router;
