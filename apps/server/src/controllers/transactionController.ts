import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as transactionService from '../services/transactionService';
import { AppError } from '../middleware/errorHandler';

const createSchema = z.object({
  amount_cents: z.number().int(),
  date: z.string(),
  description: z.string().min(1),
  category_id: z.number().int().nullable().optional(),
  account_id: z.number().int(),
});

const updateSchema = z.object({
  amount_cents: z.number().int().optional(),
  date: z.string().optional(),
  description: z.string().min(1).optional(),
  category_id: z.number().int().nullable().optional(),
  account_id: z.number().int().optional(),
});

export function getTransactions(req: Request, res: Response, next: NextFunction): void {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    res.json(transactionService.getTransactions(month));
  } catch (err) {
    next(err);
  }
}

export function createTransaction(req: Request, res: Response, next: NextFunction): void {
  try {
    const input = createSchema.parse(req.body);
    const transaction = transactionService.createTransaction(input);
    res.status(201).json(transaction);
  } catch (err) {
    next(err);
  }
}

export function updateTransaction(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid transaction id');

    const input = updateSchema.parse(req.body);
    const transaction = transactionService.updateTransaction(id, input);
    res.json(transaction);
  } catch (err) {
    next(err);
  }
}

export function deleteTransaction(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid transaction id');

    transactionService.deleteTransaction(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
