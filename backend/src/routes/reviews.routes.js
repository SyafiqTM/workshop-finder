import { Router } from 'express';

import { addReview, getWorkshopReviews } from '../controllers/reviews.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createReviewSchema } from '../schemas/review.schema.js';

const router = Router();

router.get('/:workshopId', getWorkshopReviews);
router.post('/:workshopId', requireAuth, validateBody(createReviewSchema), addReview);

export default router;
