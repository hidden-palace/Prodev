const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const { validateAskRequest, validateWebhookResponse } = require('./middleware/validation');
const { enhancedExceptionHandler, requestLogger } = require('./middleware/error-middleware');
const errorLoggingRoutes = require('./routes/error-logging');
const assistantRoutes = require('./routes/assistant');
const leadsRoutes = require('./routes/leads');
const brandingRoutes = require('./routes/branding');
const storageRoutes = require('./routes/storage');

const app = express();

// Request logging middleware (before other middleware)
app.use(requestLogger);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: process.env.NODE_ENV === 'production'
        ? ["'self'"]
        : ["'self'", "'unsafe-eval'"], // Allow unsafe-eval in non-production for WebContainer
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles for dynamic styling
      imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow images from various sources
      connectSrc: ["'self'", "https:", "wss:"], // Allow connections to APIs and WebSockets
      fontSrc: ["'self'", "https:", "data:"], // Allow fonts
      objectSrc: ["'none'"], // Disable object/embed/applet
      mediaSrc: ["'self'", "https:", "blob:"], // Allow media
      frameSrc: ["'none'"] // Disable frames
    }
  },
  crossOriginEmbedderPolicy: false // Disable COEP for compatibility
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://your-domain.com', // Replace with your actual domain
        'https://www.your-domain.com'
      ]
    : [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
      ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Request-ID',
    'X-Thread-ID',
    'X-Run-ID',
    'X-Employee-ID',
    'X-Correlation-Key',
    'X-Webhook-Secret'
  ]
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    error: 'Too many requests from this IP',
    details: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks and static files
    return req.path === '/health' || req.path.startsWith('/static/');
  }
});

app.use('/api/', limiter);

// Body parsing middleware with enhanced error handling
app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf, encoding) => {
    try {
      // Store raw body for webhook verification if needed
      req.rawBody = buf;
    } catch (jsonParseError) {
      console.error('JSON parsing error:', jsonParseError);
      throw new Error('Invalid JSON payload');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Serve static files
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0',
  etag: true,
  lastModified: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version
  });
});

// API Routes
app.use('/api/errors', errorLoggingRoutes);
app.use('/api', assistantRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/storage', storageRoutes);

// Serve the main application for all non-API routes (SPA support)
app.get('*', (req, res) => {
  // Skip API routes and static files
  if (req.path.startsWith('/api/') || req.path.startsWith('/static/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Global error handler (must be last)
app.use(enhancedExceptionHandler);

// Global process error handlers
process.on('uncaughtException', (uncaughtError) => {
  console.error('=== UNCAUGHT EXCEPTION ===');
  console.error('Error:', uncaughtError);
  console.error('Stack:', uncaughtError.stack);
  console.error('Process will exit...');
  
  // Graceful shutdown
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('=== UNHANDLED PROMISE REJECTION ===');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    console.error('Process will exit...');
    process.exit(1);
  }
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

// Start server
const PORT = config.server.port;
const server = app.listen(PORT, () => {
  console.log('🚀 OpenAI Assistant Webhook Bridge Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
  console.log(`🔑 OpenAI API configured: ${!!config.openai.apiKey && !config.openai.apiKey.includes('your_')}`);
  console.log('👥 AI Employees:');
  
  Object.entries(config.employees).forEach(([id, employee]) => {
    const assistantConfigured = !employee.assistantId.includes('placeholder');
    const webhookConfigured = !employee.webhookUrl.includes('placeholder');
    const status = assistantConfigured && webhookConfigured ? '✅' : '⚠️';
    console.log(`   ${status} ${employee.name} (${employee.role})`);
  });
  
  console.log('='.repeat(50));
  console.log(`🔗 Access the application at: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🛠️ API status: http://localhost:${PORT}/api/status`);
  
  if (config.server.nodeEnv === 'development') {
    console.log('🔧 Development mode - additional logging enabled');
  }
});

// Handle server startup errors
server.on('error', (serverError) => {
  if (serverError.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    console.error('Please either:');
    console.error('1. Stop the process using that port');
    console.error('2. Change the PORT in your .env file');
    console.error('3. Use a different port: PORT=3001 npm start');
  } else {
    console.error('❌ Server startup error:', serverError);
  }
  process.exit(1);
});

module.exports = app;