const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const payslipRoutes = require('./routes/payslips');
const leaveRoutes = require('./routes/leave');
const announcementRoutes = require('./routes/announcements');
const feedbackRoutes = require('./routes/feedback');
const pollRoutes = require('./routes/polls');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');
const { isOriginAllowed } = require('./utils/cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('./utils/logger');
const pool = require('./config/database');
const path = require('path');
const uploadRoutes = require('./routes/upload');
const notificationsRouter = require('./routes/notifications');

const app = express();

// The API runs behind Render's proxy. Without this, req.ip is the proxy's
// address, so every user shares one rate-limit bucket. Override with
// TRUST_PROXY (a hop count) if the hosting setup changes.
app.set('trust proxy', Number(process.env.TRUST_PROXY) || 1);

// ============ CORS CONFIGURATION ============
// Allowed: localhost, https *.vercel.app, and FRONTEND_URL / ALLOWED_ORIGINS.
// See utils/cors.js (set CORS_STRICT=true to drop the *.vercel.app wildcard).
const corsOptions = {
  origin: function (origin, callback) {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }

    console.log(`CORS blocked origin: ${origin}`);
    callback(null, false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
};

// Apply CORS middleware - this handles both regular and preflight requests
app.use(cors(corsOptions));

// Regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ RATE LIMITING ============
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5000,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // failed attempts per IP per 15 minutes (successful logins are not counted)
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, please try again later.' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ============ SECURITY HEADERS ============
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://lemonethotel.ph"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.onrender.com", "https://*.vercel.app"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ============ HEALTH CHECK ============
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    console.error('Health check database error:', error.message);
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/announcements', announcementRoutes);
// Polls and notifications authenticate here, explicitly. They used to rely on
// the feedback router's blanket router.use(authMiddleware) running first.
app.use('/api/polls', authMiddleware, pollRoutes);
app.use('/api/notifications', authMiddleware, notificationsRouter);
app.use('/api', feedbackRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', uploadRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Employee Portal API is running' });
});

// ============ ERROR HANDLING ============
// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// ============ START SERVER ============
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📡 API URL: http://localhost:${PORT}/api`);
  logger.info(`🌐 CORS enabled for localhost and vercel.app domains`);
});