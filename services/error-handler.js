const winston = require('winston');
const StatsD = require('hot-shots');

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
      .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
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

