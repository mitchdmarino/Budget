import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as transactionService from '../services/transactionService';
import { AppError } from '../middleware/errorHandler';

const BANK_SCRIPT = path.resolve(__dirname, '../../../../python/bank_parser.py');

const createSchema = z.object({
  amount_cents: z.number().int(),
  date: z.string(),
  description: z.string().min(1),
  category_id: z.number().int().nullable().optional(),
  tag_id: z.number().int().nullable().optional(),
  account_id: z.number().int(),
});

const updateSchema = z.object({
  amount_cents: z.number().int().optional(),
  date: z.string().optional(),
  description: z.string().min(1).optional(),
  category_id: z.number().int().nullable().optional(),
  tag_id: z.number().int().nullable().optional(),
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

// POST /api/transactions/upload
// Expects multipart/form-data with a "file" field (PDF) and optional "account_id".
// Spawns bank_parser.py, inserts parsed transactions, returns { imported, skipped }.
export async function uploadBankStatement(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.file) {
    next(new AppError(400, 'No PDF uploaded'));
    return;
  }

  const filePath = req.file.path;
  const accountId = req.body.account_id ? Number(req.body.account_id) : null;

  try {
    const parsed = await new Promise<{ posted_at: string; description: string; amount_cents: number }[]>(
      (resolve, reject) => {
        const proc = spawn('python3', [BANK_SCRIPT, filePath], { stdio: ['ignore', 'pipe', 'pipe'] });
        let stdout = '';
        let stderr = '';
        proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
        proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
        proc.on('close', (code) => {
          if (code !== 0) { reject(new Error(`Parser failed: ${stderr.trim()}`)); return; }
          try { resolve(JSON.parse(stdout)); }
          catch { reject(new Error(`Could not parse output: ${stdout}`)); }
        });
        proc.on('error', (err) => reject(new Error(`Failed to spawn parser: ${err.message}`)));
      }
    );

    const result = transactionService.importTransactions(parsed, accountId);
    res.json({ ok: true, ...result });
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete upload ${filePath}:`, err);
    });
  }
}
