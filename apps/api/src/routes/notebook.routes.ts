import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import {
  getAllNotebooks,
  getNotebookById,
  createNotebook,
  updateNotebook,
  deleteNotebook,
} from "../services/notebook.service.js";

const router = Router();

const createSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

const updateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).optional(),
  order: z.number().int().min(0).optional(),
});

router.get("/", (req: Request, res: Response) => {
  const notebooks = getAllNotebooks(req.user!.id);
  res.json({ data: notebooks });
});

router.post("/", validate(createSchema), (req: Request, res: Response) => {
  const { title } = req.body as z.infer<typeof createSchema>;
  const notebook = createNotebook(req.user!.id, title);
  res.status(201).json({ data: notebook });
});

router.get("/:id", (req: Request, res: Response) => {
  const notebook = getNotebookById(Number(req.params.id), req.user!.id);
  res.json({ data: notebook });
});

router.put("/:id", validate(updateSchema), (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateSchema>;
  const notebook = updateNotebook(Number(req.params.id), req.user!.id, updates);
  res.json({ data: notebook });
});

router.delete("/:id", (req: Request, res: Response) => {
  deleteNotebook(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Notebook deleted" });
});

export default router;
