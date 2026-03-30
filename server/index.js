const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const payslipRoutes = require('./routes/payslips');
const leaveRoutes = require('./routes/leave');
const announcementRoutes = require('./routes/announcements');
const errorHandler = require('./middleware/errorHandler');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('./utils/logger');
const pool = require('./config/database');

const app = express();

// ============ CORS CONFIGURATION ============
// Allow multiple origins (localhost for development, Vercel for production)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://employee-portal-94250qrzw-misianes-projects.vercel.app',
  // Allow any vercel.app domain (for preview deployments)
  /\.vercel\.app$/,
  // Also check environment variable
  process.env.FRONTEND_URL,
].filter(Boolean);

// CORS options
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }
    
    // Check if origin is allowed
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Regular middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ RATE LIMITING ============
// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: { error: 'Too many login attempts, please try again later.' },
});

// Apply limiters (order matters - apply before routes)
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

// ============ HEALTH CHECK ENDPOINTS ============
// Simple health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    cors_origins: allowedOrigins.filter(o => typeof o === 'string')
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/announcements', announcementRoutes);

// Basic route for testing
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
  logger.info(`🌐 CORS enabled for origins: ${allowedOrigins.filter(o => typeof o === 'string').join(', ')}`);
});