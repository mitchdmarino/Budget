import { Router } from 'express';
import * as controller from '../controllers/tagController';

const router = Router();

router.get('/',       controller.getTags);
router.post('/',      controller.createTag);
router.put('/:id',    controller.updateTag);
router.delete('/:id', controller.deleteTag);

export default router;
