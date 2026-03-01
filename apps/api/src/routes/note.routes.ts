import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import {
  getNotesBySection,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
} from "../services/note.service.js";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(75),
  content: z.string().optional().default(""),
});

const updateSchema = z.object({
  title: z.string().min(1).max(75).optional(),
  content: z.string().optional(),
  order: z.number().int().min(0).optional(),
});

// GET /sections/:sectionId/notes
router.get("/sections/:sectionId/notes", (req: Request, res: Response) => {
  const notes = getNotesBySection(Number(req.params.sectionId), req.user!.id);
  res.json({ data: notes });
});

// POST /sections/:sectionId/notes
router.post(
  "/sections/:sectionId/notes",
  validate(createSchema),
  (req: Request, res: Response) => {
    const { title, content } = req.body as z.infer<typeof createSchema>;
    const note = createNote(Number(req.params.sectionId), req.user!.id, title, content);
    res.status(201).json({ data: note });
  }
);

// GET /notes/:id
router.get("/notes/:id", (req: Request, res: Response) => {
  const note = getNoteById(Number(req.params.id), req.user!.id);
  res.json({ data: note });
});

// PUT /notes/:id
router.put("/notes/:id", validate(updateSchema), (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateSchema>;
  const note = updateNote(Number(req.params.id), req.user!.id, updates);
  res.json({ data: note });
});

// DELETE /notes/:id
router.delete("/notes/:id", (req: Request, res: Response) => {
  deleteNote(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Note deleted" });
});

export default router;
