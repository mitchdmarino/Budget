import { Router } from 'express';
import * as controller from '../controllers/transactionController';

const router = Router();

router.get('/', controller.getTransactions);
router.post('/', controller.createTransaction);
router.put('/:id', controller.updateTransaction);
router.delete('/:id', controller.deleteTransaction);

export default router;
