import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as categoryService from '../services/categoryService';
import { AppError } from '../middleware/errorHandler';

const createSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a valid hex string e.g. #ff5733'),
  budget_cents: z.number().int().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a valid hex string e.g. #ff5733').optional(),
  budget_cents: z.number().int().nullable().optional(),
});

export function getCategories(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(categoryService.getCategories());
  } catch (err) {
    next(err);
  }
}

export function createCategory(req: Request, res: Response, next: NextFunction): void {
  try {
    const input = createSchema.parse(req.body);
    const category = categoryService.createCategory(input);
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
}

export function updateCategory(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid category id');

    const input = updateSchema.parse(req.body);
    const category = categoryService.updateCategory(id, input);
    res.json(category);
  } catch (err) {
    next(err);
  }
}

export function deleteCategory(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid category id');

    categoryService.deleteCategory(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
