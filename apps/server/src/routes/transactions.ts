import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/transactionController';

const router = Router();

const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

const upload = multer({
  dest: UPLOADS_DIR,
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
});

router.get('/', controller.getTransactions);
router.post('/', controller.createTransaction);
router.put('/:id', controller.updateTransaction);
router.delete('/:id', controller.deleteTransaction);
router.post('/upload', upload.single('file'), controller.uploadBankStatement);

export default router;
