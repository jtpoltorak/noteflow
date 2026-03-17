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
  getSharedNotes,
  lockNote,
  unlockNote,
  accessLockedNote,
  getNoteLinkContext,
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

// GET /notes/shared
router.get("/notes/shared", (req: Request, res: Response) => {
  const notes = getSharedNotes(req.user!.id);
  res.json({ data: notes });
});

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

const lockSchema = z.object({
  password: z.string().min(4, "Password must be at least 4 characters").max(100),
});

// PUT /notes/:id/lock
router.put(
  "/notes/:id/lock",
  validate(lockSchema),
  (req: Request, res: Response) => {
    const { password } = req.body as z.infer<typeof lockSchema>;
    lockNote(Number(req.params.id), req.user!.id, password);
    res.json({ data: null, message: "Note locked" });
  }
);

const unlockSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// PUT /notes/:id/unlock
router.put(
  "/notes/:id/unlock",
  validate(unlockSchema),
  (req: Request, res: Response) => {
    const { password } = req.body as z.infer<typeof unlockSchema>;
    unlockNote(Number(req.params.id), req.user!.id, password);
    res.json({ data: null, message: "Note unlocked" });
  }
);

const accessSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// POST /notes/:id/access
router.post(
  "/notes/:id/access",
  validate(accessSchema),
  (req: Request, res: Response) => {
    const { password } = req.body as z.infer<typeof accessSchema>;
    const note = accessLockedNote(Number(req.params.id), req.user!.id, password);
    res.json({ data: note });
  }
);

// GET /notes/:id/context (for note-to-note link navigation)
router.get("/notes/:id/context", (req: Request, res: Response) => {
  const context = getNoteLinkContext(Number(req.params.id), req.user!.id);
  res.json({ data: context });
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
  const permanent = req.query.permanent === "true";
  deleteNote(Number(req.params.id), req.user!.id, permanent);
  res.json({ data: null, message: "Note deleted" });
});

export default router;
