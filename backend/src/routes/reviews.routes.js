import { Router } from 'express';

import {
  addReview,
  getWorkshopReviews,
  getUserReviews,
  updateReviewStatus,
  getPendingReviews
} from '../controllers/reviews.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { createReviewSchema } from '../schemas/review.schema.js';

const router = Router();

// Static routes FIRST (before dynamic :workshopId to avoid param collision)

// Authenticated user: get own reviews (for profile page)
router.get('/user/my', requireAuth, getUserReviews);

// Admin: get all pending reviews
router.get('/admin/pending', requireAuth, requireAdmin, getPendingReviews);

// Admin: approve or reject a review
router.patch('/:reviewId/status', requireAuth, requireAdmin, updateReviewStatus);

// Public: get approved reviews for a workshop
router.get('/:workshopId', getWorkshopReviews);

// Authenticated user: submit a review
router.post('/:workshopId', requireAuth, validateBody(createReviewSchema), addReview);

export default router;
