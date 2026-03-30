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


const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/announcements', announcementRoutes);
app.use(errorHandler);

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

// Apply limiters
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);


// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://lemonethotel.ph"],
      scriptSrc: ["'self'"],
    },
  },
}));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
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

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Employee Portal API is running' });
});

// Error handling middleware
app.use(errorHandler);

// Set up port
const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server is running on port ${PORT}`);
  logger.info(`📡 API URL: http://localhost:${PORT}/api`);
});