import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as accountService from '../services/accountService';
import { AppError } from '../middleware/errorHandler';

const ACCOUNT_TYPES = ['checking', 'savings', 'credit', 'retirement'] as const;

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  type: z.enum(ACCOUNT_TYPES).optional(),
});

export function getAccounts(_req: Request, res: Response, next: NextFunction): void {
  try {
    res.json(accountService.getAccounts());
  } catch (err) {
    next(err);
  }
}

export function createAccount(req: Request, res: Response, next: NextFunction): void {
  try {
    const input = createSchema.parse(req.body);
    const account = accountService.createAccount(input);
    res.status(201).json(account);
  } catch (err) {
    next(err);
  }
}

export function updateAccount(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid account id');

    const input = updateSchema.parse(req.body);
    const account = accountService.updateAccount(id, input);
    res.json(account);
  } catch (err) {
    next(err);
  }
}

export function deleteAccount(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid account id');

    accountService.deleteAccount(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
