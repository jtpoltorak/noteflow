import { Router, Request, Response } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.middleware.js";
import {
  getUserTemplates,
  createUserTemplate,
  updateUserTemplate,
  deleteUserTemplate,
} from "../services/template.service.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(75),
  description: z.string().max(200).optional().default(""),
  content: z.string(),
  category: z.string().max(30).optional().default("Custom"),
});

const updateSchema = z.object({
  name: z.string().min(1).max(75).optional(),
  description: z.string().max(200).optional(),
  content: z.string().optional(),
  category: z.string().max(30).optional(),
});

// GET /templates
router.get("/templates", (req: Request, res: Response) => {
  const templates = getUserTemplates(req.user!.id);
  res.json({ data: templates });
});

// POST /templates
router.post("/templates", validate(createSchema), (req: Request, res: Response) => {
  const data = req.body as z.infer<typeof createSchema>;
  const template = createUserTemplate(req.user!.id, data);
  res.status(201).json({ data: template });
});

// PUT /templates/:id
router.put("/templates/:id", validate(updateSchema), (req: Request, res: Response) => {
  const updates = req.body as z.infer<typeof updateSchema>;
  const template = updateUserTemplate(Number(req.params.id), req.user!.id, updates);
  res.json({ data: template });
});

// DELETE /templates/:id
router.delete("/templates/:id", (req: Request, res: Response) => {
  deleteUserTemplate(Number(req.params.id), req.user!.id);
  res.json({ data: null, message: "Template deleted" });
});

export default router;
