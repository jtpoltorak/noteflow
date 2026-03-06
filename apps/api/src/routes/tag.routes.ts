import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import {
  getUserTags,
  getNotesByTag,
  getTagsForNote,
  createTag,
  renameTag,
  deleteTag,
  addTagToNote,
  removeTagFromNote,
} from "../services/tag.service.js";

const router = Router();

const tagNameSchema = z.object({
  name: z.string().min(1, "Tag name is required").max(30).trim(),
});

// GET /tags
router.get("/tags", (req: Request, res: Response) => {
  const tags = getUserTags(req.user!.id);
  res.json({ data: tags });
});

// POST /tags
router.post("/tags", validate(tagNameSchema), (req: Request, res: Response) => {
  const { name } = req.body as z.infer<typeof tagNameSchema>;
  const tag = createTag(req.user!.id, name);
  res.status(201).json({ data: tag });
});

// PUT /tags/:id
router.put("/tags/:id", validate(tagNameSchema), (req: Request, res: Response) => {
  const { name } = req.body as z.infer<typeof tagNameSchema>;
  const tag = renameTag(Number(req.params.id), req.user!.id, name);
  res.json({ data: tag });
});

// DELETE /tags/:id
router.delete("/tags/:id", (req: Request, res: Response) => {
  deleteTag(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Tag deleted" });
});

// GET /tags/:id/notes
router.get("/tags/:id/notes", (req: Request, res: Response) => {
  const notes = getNotesByTag(Number(req.params.id), req.user!.id);
  res.json({ data: notes });
});

// GET /notes/:id/tags
router.get("/notes/:id/tags", (req: Request, res: Response) => {
  const tags = getTagsForNote(Number(req.params.id), req.user!.id);
  res.json({ data: tags });
});

// POST /notes/:id/tags
router.post("/notes/:id/tags", validate(tagNameSchema), (req: Request, res: Response) => {
  const { name } = req.body as z.infer<typeof tagNameSchema>;
  const tag = addTagToNote(Number(req.params.id), name, req.user!.id);
  res.status(201).json({ data: tag });
});

// DELETE /notes/:noteId/tags/:tagId
router.delete("/notes/:noteId/tags/:tagId", (req: Request, res: Response) => {
  removeTagFromNote(Number(req.params.noteId), Number(req.params.tagId), req.user!.id);
  res.json({ data: null, message: "Tag removed from note" });
});

export default router;
