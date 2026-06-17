import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import {
  getCategories,
  createCategory,
  deleteCategory,
} from '../controllers/categories.controller.js';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

router.get('/', getCategories);
router.post('/', validate(categorySchema), createCategory);
router.delete('/:id', deleteCategory);

export default router;
