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
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const logger = require('./utils/logger');
const pool = require('./config/database');
const path = require('path');
const uploadRoutes = require('./routes/upload');
const notificationsRouter = require('./routes/notifications');

const app = express();

// ============ CORS CONFIGURATION ============
// Allow all vercel domains and localhost
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }
    
    // Allow localhost for development
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return callback(null, true);
    }
    
    // Allow any vercel.app domain (production)
    if (origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    // Also check environment variable
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
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
  max: 500,
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
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api', feedbackRoutes);
app.use('/api/polls', pollRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', uploadRoutes);
app.use('/api/notifications', notificationsRouter);

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