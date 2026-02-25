import { Router } from 'express';

import { googleAuth, login, me, register, updateProfile } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { googleAuthSchema, loginSchema, registerSchema, updateProfileSchema } from '../schemas/auth.schema.js';

const router = Router();

router.post('/register', validateBody(registerSchema), register);
router.post('/login', validateBody(loginSchema), login);
router.post('/google', validateBody(googleAuthSchema), googleAuth);
router.get('/me', requireAuth, me);
router.patch('/me', requireAuth, validateBody(updateProfileSchema), updateProfile);

export default router;
