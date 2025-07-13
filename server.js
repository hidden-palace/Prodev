const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const config = require('./config');
const { validateAskRequest, validateWebhookResponse } = require('./middleware/validation');
const { enhancedErrorHandler, requestLogger } = require('./middleware/error-middleware');
const errorLoggingRoutes = require('./routes/error-logging');
const assistantRoutes = require('./routes/assistant');
const leadsRoutes = require('./routes/leads');
const brandingRoutes = require('./routes/branding');
const storageRoutes = require('./routes/storage');

const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: process.env.NODE_ENV === 'production'
        ? ["'self'"]
        : ["'self'", "'unsafe-eval'"], // Allow unsafe-eval in non-production for WebContainer
      styleSrc: ["'self'"]
    }
  }
}));

// Handle errors using the renamed 'errorHandler' (instead of 'error')
app.use(enhancedErrorHandler);

// Other routes and middleware setup

module.exports = app;
