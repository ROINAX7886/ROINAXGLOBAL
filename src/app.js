import express from 'express';
import helmet from 'helmet';
import session from 'express-session';
import path from 'path';
import { fileURLToPath } from 'url';
import expressLayouts from 'express-ejs-layouts';

import authRoutes from './routes/auth.routes.js';
import pageRoutes from './routes/page.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Silence favicon 404
app.get('/favicon.ico', (req, res) => res.status(204).end());

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.set('layout', 'layouts/base');

// Static assets (CSS, client JS, images)
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(
  session({
    name: 'roinax_sid',
    secret: process.env.SESSION_SECRET || 'roinax_dev_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      sameSite: 'lax',
    },
  })
);

// Mount routes
app.use('/', pageRoutes);
app.use('/api/auth', authRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('[SERVER_ERROR]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

export default app;