const winston = require('winston');
const StatsD = require('hot-shots');

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'apikey', 'authorization'];

function sanitize(value) {
  if (value instanceof Error) {
    return { message: value.message, stack: value.stack };
  }
  if (typeof value !== 'object' || value === null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(sanitize);
  }
  return Object.keys(value).reduce((acc, key) => {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.includes(lower)) {
      acc[key] = '[REDACTED]';
    } else {
      acc[key] = sanitize(value[key]);
    }
    return acc;
  }, {});
}

// Configure Winston logger to emit structured JSON logs
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

// StatsD client for Datadog/ELK integrations
const metrics = new StatsD({ prefix: 'webhook_bridge.' });

// Patch global console to route through Winston and capture error metrics
['log', 'info', 'warn', 'error'].forEach((level) => {
  const winstonLevel = level === 'log' ? 'info' : level;
  console[level] = (...args) => {
    const message = args
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        try {
          return JSON.stringify(sanitize(arg));
        } catch (err) {
          return '[Unserializable argument]';
        }
      })
      .join(' ');
    logger[winstonLevel](message);
    if (level === 'error') {
      metrics.increment('error.count');
    }
  };
});

function recordWebhookSuccess() {
  metrics.increment('webhook.success');
}

function recordWebhookFailure() {
  metrics.increment('webhook.failure');
}

module.exports = {
  logger,
  metrics,
  recordWebhookSuccess,
  recordWebhookFailure
};
