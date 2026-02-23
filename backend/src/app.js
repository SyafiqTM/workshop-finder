import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes.js';
import workshopRoutes from './routes/workshops.routes.js';
import favoriteRoutes from './routes/favorites.routes.js';
import reviewRoutes from './routes/reviews.routes.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:5174'
].filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/workshops', workshopRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/reviews', reviewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
