// Log startup immediately for debugging
console.log('🚀 Starting ACMS Server...');
console.log('Node version:', process.version);
console.log('NODE_ENV:', process.env.NODE_ENV || 'not set');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const logger = require('./utils/logger');
const db = require('./config/database');
const { initializeDatabase } = require('./scripts/initialize');

console.log('✅ Dependencies loaded');

// Import routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const assetRoutes = require('./routes/assets');
const stockRoutes = require('./routes/stock');
const vehicleRoutes = require('./routes/vehicles');
const contractRoutes = require('./routes/contracts');
const dashboardRoutes = require('./routes/dashboard');
const reportRoutes = require('./routes/reports');
const notificationRoutes = require('./routes/notifications');
const documentRoutes = require('./routes/documents');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - MUST be before other middleware
// CLIENT_URL supports comma-separated origins (e.g. Vercel preview + production URLs)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// Rate limiting - more lenient in development
const isDevelopment = process.env.NODE_ENV !== 'production';

// Auth endpoints rate limiter - more lenient for login/auth checks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 200 : 50, // Higher limit in development for auth
  message: 'Too many authentication requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiter - more lenient in development, excludes auth routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Higher limit in development
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/auth') // Skip auth routes (handled separately)
});

// Apply auth limiter to auth routes
app.use('/api/auth', authLimiter);

// Apply general limiter to all other API routes
app.use('/api/', generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/documents', documentRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('📁 Checking directories...');
    // Ensure required directories exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory');
    }
    
    // Log environment info for debugging
    console.log('🔍 Environment check:');
    console.log(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
    console.log(`  PORT: ${PORT}`);
    console.log(`  DB_TYPE: ${process.env.DB_TYPE || 'sqlite (default)'}`);
    
    if (process.env.DB_TYPE === 'postgresql') {
      console.log('📊 PostgreSQL configuration:');
      console.log(`  DB_HOST: ${process.env.DB_HOST ? 'SET ✓' : 'NOT SET ✗'}`);
      console.log(`  DB_PORT: ${process.env.DB_PORT || '5432'}`);
      console.log(`  DB_NAME: ${process.env.DB_NAME || 'acms'}`);
      console.log(`  DB_USER: ${process.env.DB_USER || 'acms_user'}`);
      console.log(`  DB_PASSWORD: ${process.env.DB_PASSWORD ? 'SET ✓' : 'NOT SET ✗'}`);
      
      if (!process.env.DB_HOST || !process.env.DB_PASSWORD) {
        console.error('❌ ERROR: Missing required database environment variables!');
        console.error('Please set the following in Render Dashboard → Environment:');
        console.error('  - DB_HOST');
        console.error('  - DB_PORT');
        console.error('  - DB_NAME');
        console.error('  - DB_USER');
        console.error('  - DB_PASSWORD');
        logger.error('Missing required database environment variables!');
        process.exit(1);
      }
    }
    
    console.log('🔌 Connecting to database...');
    db.connect();
    console.log('✅ Database connection established');
    
    // Test database connection with a simple query
    try {
      if (process.env.DB_TYPE === 'postgresql') {
        console.log('🧪 Testing PostgreSQL connection...');
        await db.query('SELECT NOW()');
        console.log('✅ PostgreSQL connection test successful');
      }
    } catch (dbError) {
      console.error('❌ Database connection test failed:', dbError.message);
      console.error('Full error:', dbError);
      logger.error('Database connection test failed:', dbError);
      throw dbError;
    }
    
    console.log('🗄️ Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');
    
    console.log(`🚀 Starting server on port ${PORT}...`);
    app.listen(PORT, '0.0.0.0', () => {
      console.log('✅✅✅ SERVER STARTED SUCCESSFULLY ✅✅✅');
      console.log(`   Port: ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Database: ${process.env.DB_TYPE || 'sqlite'}`);
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`Database type: ${process.env.DB_TYPE || 'sqlite'}`);
    });
  } catch (error) {
    console.error('❌❌❌ SERVER STARTUP FAILED ❌❌❌');
    console.error('Error message:', error.message);
    console.error('Error name:', error.name);
    if (error.stack) {
      console.error('Stack trace:');
      console.error(error.stack);
    }
    logger.error('Failed to start server:', error);
    logger.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      dbType: process.env.DB_TYPE,
      hasDbHost: !!process.env.DB_HOST,
      hasDbPort: !!process.env.DB_PORT,
      hasDbName: !!process.env.DB_NAME,
      hasDbUser: !!process.env.DB_USER,
      hasDbPassword: !!process.env.DB_PASSWORD,
      nodeEnv: process.env.NODE_ENV,
      port: PORT
    });
    process.exit(1);
  }
}

startServer();

module.exports = app;

