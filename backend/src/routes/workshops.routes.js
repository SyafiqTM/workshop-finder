import { Router } from 'express';

import {
  createWorkshop,
  getNearbyWorkshops,
  getWorkshopById,
  getWorkshops
} from '../controllers/workshops.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery } from '../middleware/validate.middleware.js';
import { createWorkshopSchema, nearbyQuerySchema } from '../schemas/workshop.schema.js';

const router = Router();

router.get('/', getWorkshops);
router.get('/nearby', validateQuery(nearbyQuerySchema), getNearbyWorkshops);
router.get('/:id', getWorkshopById);
router.post('/', requireAuth, validateBody(createWorkshopSchema), createWorkshop);

export default router;
