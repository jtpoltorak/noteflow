import { Router, Request, Response } from "express";
import {
  getDeletedItems,
  restoreNotebook,
  restoreSection,
  restoreNote,
  permanentlyDeleteNotebook,
  permanentlyDeleteSection,
  permanentlyDeleteNote,
  emptyRecycleBin,
} from "../services/recycle-bin.service.js";

const router = Router();

// GET /recycle-bin
router.get("/", (req: Request, res: Response) => {
  const items = getDeletedItems(req.user!.id);
  res.json({ data: items });
});

// POST /recycle-bin/restore/notebook/:id
router.post("/restore/notebook/:id", (req: Request, res: Response) => {
  restoreNotebook(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Notebook restored" });
});

// POST /recycle-bin/restore/section/:id
router.post("/restore/section/:id", (req: Request, res: Response) => {
  restoreSection(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Section restored" });
});

// POST /recycle-bin/restore/note/:id
router.post("/restore/note/:id", (req: Request, res: Response) => {
  restoreNote(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Note restored" });
});

// DELETE /recycle-bin/notebook/:id
router.delete("/notebook/:id", (req: Request, res: Response) => {
  permanentlyDeleteNotebook(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Notebook permanently deleted" });
});

// DELETE /recycle-bin/section/:id
router.delete("/section/:id", (req: Request, res: Response) => {
  permanentlyDeleteSection(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Section permanently deleted" });
});

// DELETE /recycle-bin/note/:id
router.delete("/note/:id", (req: Request, res: Response) => {
  permanentlyDeleteNote(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Note permanently deleted" });
});

// DELETE /recycle-bin
router.delete("/", (req: Request, res: Response) => {
  emptyRecycleBin(req.user!.id);
  res.json({ data: null, message: "Recycle bin emptied" });
});

export default router;
