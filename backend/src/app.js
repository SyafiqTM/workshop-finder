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
const bodyLimit = process.env.REQUEST_BODY_LIMIT || '10mb';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://workshop-finder.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173'
].filter(Boolean);

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: bodyLimit }));
app.use(morgan('dev'));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isProduction ? 300 : 2000,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const healthcheckHandler = (_req, res) => {
  res.json({ status: 'ok' });
};

app.get('/health', healthcheckHandler);
app.get('/healthcheck', healthcheckHandler);

app.use('/auth', authRoutes);
app.use('/workshops', workshopRoutes);
app.use('/favorites', favoriteRoutes);
app.use('/reviews', reviewRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
