import { Router } from 'express';
import * as controller from '../controllers/summaryController';

const router = Router();

// GET /api/summary?month=YYYY-MM
router.get('/', controller.getSummary);

// GET /api/summary/history?months=6
router.get('/history', controller.getSummaryHistory);

// GET /api/summary/goal?month=YYYY-MM
router.get('/goal', controller.getBudgetGoal);

// PUT /api/summary/goal
router.put('/goal', controller.upsertBudgetGoal);

export default router;
