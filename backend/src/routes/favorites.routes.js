import { Router } from 'express';

import { addFavorite, getFavorites, removeFavorite } from '../controllers/favorites.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', getFavorites);
router.post('/:workshopId', addFavorite);
router.delete('/:workshopId', removeFavorite);

export default router;
