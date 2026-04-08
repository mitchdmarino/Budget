import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as paycheckService from '../services/paycheckService';
import { AppError } from '../middleware/errorHandler';
import type { CreatePaycheckInput } from '@budget/shared';

const createSchema = z.object({
  gross_cents: z.number().int(),
  taxes_cents: z.number().int().default(0),
  retirement_cents: z.number().int().default(0),
  other_deductions_cents: z.number().int().default(0),
  net_cents: z.number().int(),
  pay_date: z.string(),
  notes: z.string().nullable().optional(),
});

const updateSchema = z.object({
  gross_cents: z.number().int().optional(),
  taxes_cents: z.number().int().optional(),
  retirement_cents: z.number().int().optional(),
  other_deductions_cents: z.number().int().optional(),
  net_cents: z.number().int().optional(),
  pay_date: z.string().optional(),
  notes: z.string().nullable().optional(),
});

const SCRIPT_PATH = path.resolve(__dirname, '../../../../python/pay_parser.py');

function parsePaystub(filePath: string): Promise<CreatePaycheckInput> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [SCRIPT_PATH, filePath], { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d: Buffer) => { stdout += d.toString(); });
    proc.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) { reject(new Error(`Parser failed: ${stderr.trim()}`)); return; }
      try { resolve(JSON.parse(stdout) as CreatePaycheckInput); }
      catch { reject(new Error(`Could not parse output: ${stdout}`)); }
    });
    proc.on('error', (err) => reject(new Error(`Failed to spawn parser: ${err.message}`)));
  });
}

export function getPaychecks(req: Request, res: Response, next: NextFunction): void {
  try {
    const month = typeof req.query.month === 'string' ? req.query.month : undefined;
    res.json(paycheckService.getPaychecks(month));
  } catch (err) {
    next(err);
  }
}

export function getPaycheck(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid paycheck id');
    res.json(paycheckService.getPaycheck(id));
  } catch (err) {
    next(err);
  }
}

export function createPaycheck(req: Request, res: Response, next: NextFunction): void {
  try {
    const input = createSchema.parse(req.body);
    const paycheck = paycheckService.createPaycheck(input);
    res.status(201).json(paycheck);
  } catch (err) {
    next(err);
  }
}

export function updatePaycheck(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid paycheck id');
    const input = updateSchema.parse(req.body);
    const paycheck = paycheckService.updatePaycheck(id, input);
    res.json(paycheck);
  } catch (err) {
    next(err);
  }
}

export function deletePaycheck(req: Request, res: Response, next: NextFunction): void {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) throw new AppError(400, 'Invalid paycheck id');
    paycheckService.deletePaycheck(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/paychecks/upload
// Expects multipart/form-data with a single field named "file" (PDF).
// Saves the file temporarily, spawns pay_parser.py with the path,
// inserts the parsed paycheck into the DB, then deletes the temp file.
export async function uploadPaycheckPdf(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (!req.file) {
    next(new AppError(400, 'No PDF uploaded'));
    return;
  }

  const filePath = req.file.path;

  try {
    const parsed = await parsePaystub(filePath);
    const paycheck = paycheckService.createPaycheck(parsed);
    res.status(201).json(paycheck);
  } catch (err) {
    next(err);
  } finally {
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete upload ${filePath}:`, err);
    });
  }
}
