import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as tagService from '../services/tagService';
import { AppError } from '../middleware/errorHandler';

const createSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a valid hex string e.g. #ff5733'),
  limit_cents: z.number().int().nullable().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'color must be a valid hex string e.g. #ff5733').optional(),
  limit_cents: z.number().int().nullable().optional(),
});

export function getTags(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(tagService.getTags());
  } catch (err) {
    next(err);
  }
}

export function createTag(req: Request, res: Response, next: NextFunction): void {
  try {
    const input = createSchema.parse(req.body);
    const tag = tagService.createTag(input);
    res.status(201).json(tag);
  } catch (err) {
    next(err);
  }
}

export function updateTag(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid tag id');

    const input = updateSchema.parse(req.body);
    const tag = tagService.updateTag(id, input);
    res.json(tag);
  } catch (err) {
    next(err);
  }
}

export function deleteTag(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid tag id');

    tagService.deleteTag(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
