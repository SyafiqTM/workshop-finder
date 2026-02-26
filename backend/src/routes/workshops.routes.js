import { Router } from 'express';

import {
  createWorkshop,
  getNearbyWorkshops,
  getWorkshopById,
  getWorkshops,
  getPendingWorkshops,
  updateWorkshopStatus
} from '../controllers/workshops.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { createWorkshopSchema, nearbyQuerySchema } from '../schemas/workshop.schema.js';

const router = Router();

router.get('/', getWorkshops);
router.get('/nearby', validateQuery(nearbyQuerySchema), getNearbyWorkshops);
router.get('/admin/pending', requireAuth, requireAdmin, getPendingWorkshops);
router.get('/:id', getWorkshopById);
router.post('/', requireAuth, requireAdmin, validateBody(createWorkshopSchema), createWorkshop);
router.patch('/:id/status', requireAuth, requireAdmin, updateWorkshopStatus);

export default router;
