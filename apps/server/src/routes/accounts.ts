import { Router } from 'express';
import * as controller from '../controllers/accountController';

const router = Router();

router.get('/', controller.getAccounts);
router.post('/', controller.createAccount);
router.put('/:id', controller.updateAccount);
router.delete('/:id', controller.deleteAccount);

export default router;
