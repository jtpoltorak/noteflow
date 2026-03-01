import { Router, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../middleware/error.middleware.js";
import { searchNotes } from "../services/search.service.js";

const router = Router();

const querySchema = z.object({
  q: z.string().min(1, "Search query is required").max(200),
});

// GET /search?q=...
router.get("/", (req: Request, res: Response) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    throw new AppError(400, parsed.error.errors[0].message, "VALIDATION_ERROR");
  }

  const results = searchNotes(req.user!.id, parsed.data.q);
  res.json({ data: results });
});

export default router;
