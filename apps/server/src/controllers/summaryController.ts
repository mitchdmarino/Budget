import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as summaryService from '../services/summaryService';
import * as budgetGoalService from '../services/budgetGoalService';
import { AppError } from '../middleware/errorHandler';

const monthSchema = z.string().regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM');

const upsertGoalSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/),
  savings_goal_cents: z.number().int(),
});

export function getSummary(req: Request, res: Response, next: NextFunction): void {
  try {
    const month = monthSchema.parse(req.query.month);
    res.json(summaryService.getMonthlySummary(month));
  } catch (err) {
    next(err);
  }
}

export function getSummaryHistory(req: Request, res: Response, next: NextFunction): void {
  try {
    const months = req.query.months !== undefined ? Number(req.query.months) : 6;
    if (isNaN(months) || months < 1 || months > 24) {
      throw new AppError(400, 'months must be between 1 and 24');
    }
    res.json(summaryService.getSummaryHistory(months));
  } catch (err) {
    next(err);
  }
}

export function upsertBudgetGoal(req: Request, res: Response, next: NextFunction): void {
  try {
    const input = upsertGoalSchema.parse(req.body);
    const goal = budgetGoalService.upsertBudgetGoal(input);
    res.json(goal);
  } catch (err) {
    next(err);
  }
}

export function getBudgetGoal(req: Request, res: Response, next: NextFunction): void {
  try {
    const month = monthSchema.parse(req.query.month);
    const goal = budgetGoalService.getBudgetGoal(month);
    if (!goal) {
      res.json(null);
      return;
    }
    res.json(goal);
  } catch (err) {
    next(err);
  }
}
