import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import {
  getSectionsByNotebook,
  createSection,
  updateSection,
  deleteSection,
} from "../services/section.service.js";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(50),
});

const updateSchema = z.object({
  title: z.string().min(1).max(50).optional(),
  order: z.number().int().min(0).optional(),
});

// GET /notebooks/:notebookId/sections
router.get("/notebooks/:notebookId/sections", (req: Request, res: Response) => {
  const sections = getSectionsByNotebook(Number(req.params.notebookId), req.user!.id);
  res.json({ data: sections });
});

// POST /notebooks/:notebookId/sections
router.post(
  "/notebooks/:notebookId/sections",
  validate(createSchema),
  (req: Request, res: Response) => {
    const { title } = req.body as z.infer<typeof createSchema>;
    const section = createSection(Number(req.params.notebookId), req.user!.id, title);
    res.status(201).json({ data: section });
  }
);

// PUT /sections/:id
router.put("/sections/:id", validate(updateSchema), (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateSchema>;
  const section = updateSection(Number(req.params.id), req.user!.id, updates);
  res.json({ data: section });
});

// DELETE /sections/:id
router.delete("/sections/:id", (req: Request, res: Response) => {
  deleteSection(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Section deleted" });
});

export default router;
