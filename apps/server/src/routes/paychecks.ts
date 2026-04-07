import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/paycheckController';

const router = Router();

const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');

const upload = multer({
  dest: UPLOADS_DIR,
  fileFilter: (_req, file, cb) => cb(null, file.mimetype === 'application/pdf'),
});

router.get('/', controller.getPaychecks);
router.get('/:id', controller.getPaycheck);
router.post('/', controller.createPaycheck);
router.put('/:id', controller.updatePaycheck);
router.delete('/:id', controller.deletePaycheck);
router.post('/upload', upload.single('file'), controller.uploadPaycheckPdf);

export default router;
