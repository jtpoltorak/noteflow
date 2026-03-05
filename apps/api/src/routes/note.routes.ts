import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import {
  getNotesBySection,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  archiveNote,
  unarchiveNote,
  getArchivedNotes,
  favoriteNote,
  unfavoriteNote,
  getFavoriteNotes,
  shareNote,
  unshareNote,
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
  sectionId: z.number().int().positive().optional(),
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

// GET /notes/archived
router.get("/notes/archived", (req: Request, res: Response) => {
  const notes = getArchivedNotes(req.user!.id);
  res.json({ data: notes });
});

// POST /notes/:id/archive
router.post("/notes/:id/archive", (req: Request, res: Response) => {
  archiveNote(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Note archived" });
});

const unarchiveSchema = z.object({
  sectionId: z.number().int().positive(),
});

// POST /notes/:id/unarchive
router.post(
  "/notes/:id/unarchive",
  validate(unarchiveSchema),
  (req: Request, res: Response) => {
    const { sectionId } = req.body as z.infer<typeof unarchiveSchema>;
    unarchiveNote(Number(req.params.id), req.user!.id, sectionId);
    res.json({ data: null, message: "Note restored" });
  }
);

// GET /notes/favorites
router.get("/notes/favorites", (req: Request, res: Response) => {
  const notes = getFavoriteNotes(req.user!.id);
  res.json({ data: notes });
});

// POST /notes/:id/favorite
router.post("/notes/:id/favorite", (req: Request, res: Response) => {
  favoriteNote(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Note favorited" });
});

// POST /notes/:id/unfavorite
router.post("/notes/:id/unfavorite", (req: Request, res: Response) => {
  unfavoriteNote(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Note unfavorited" });
});

// POST /notes/:id/share
router.post("/notes/:id/share", (req: Request, res: Response) => {
  const shareToken = shareNote(Number(req.params.id), req.user!.id);
  res.json({ data: { shareToken } });
});

// POST /notes/:id/unshare
router.post("/notes/:id/unshare", (req: Request, res: Response) => {
  unshareNote(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Sharing disabled" });
});

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
