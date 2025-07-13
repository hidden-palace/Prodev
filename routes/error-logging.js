/**
 * Error Logging Routes
 * Handles client-side error reporting and server-side error tracking
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

/**
 * POST /errors - Log client-side errors
 */
router.post('/errors', async (req, res, next) => {
  try {
    const errorData = {
      ...req.body,
      serverTimestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.requestId || `error_${Date.now()}`
    };

    // Log to console
    console.error('CLIENT_ERROR:', JSON.stringify(errorData, null, 2));

    // Store error for analysis
    await storeClientError(errorData);

    // Send to monitoring service if configured
    if (process.env.ERROR_MONITORING_URL) {
      await sendToMonitoringService(errorData);
    }

    res.json({
      success: true,
      message: 'Error logged successfully',
      errorId: errorData.requestId
    });

  } catch (loggingError) {
    console.error('Failed to log client error:', loggingError);
    next(loggingError);
  }
});

/**
 * GET /errors/stats - Get error statistics
 */
router.get('/errors/stats', async (req, res, next) => {
  try {
    const stats = await getErrorStatistics();
    res.json(stats);
  } catch (statsError) {
    console.error('Failed to get error statistics:', statsError);
    next(statsError);
  }
});

/**
 * GET /errors/recent - Get recent errors
 */
router.get('/errors/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const errors = await getRecentErrors(limit);
    res.json(errors);
  } catch (recentError) {
    console.error('Failed to get recent errors:', recentError);
    next(recentError);
  }
});

/**
 * Store client error for analysis
 */
async function storeClientError(errorData) {
  try {
    const errorDir = path.join(__dirname, '../logs/client-errors');
    
    // Ensure directory exists
    try {
      await fs.access(errorDir);
    } catch {
      await fs.mkdir(errorDir, { recursive: true });
    }

    // Store error with timestamp
    const filename = `client_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    const filepath = path.join(errorDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(errorData, null, 2));
    console.log('Client error stored:', filepath);

    // Also append to daily log file
    const dailyLogFile = path.join(errorDir, `errors_${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${errorData.serverTimestamp} - ${errorData.type || 'unknown'} - ${errorData.message || 'No message'}\n`;
    
    await fs.appendFile(dailyLogFile, logEntry);

  } catch (storageError) {
    console.error('Failed to store client error:', storageError);
  }
}

/**
 * Send error to external monitoring service
 */
async function sendToMonitoringService(errorData) {
  try {
    const monitoringUrl = process.env.ERROR_MONITORING_URL;
    const apiKey = process.env.ERROR_MONITORING_API_KEY;

    if (!monitoringUrl) return;

    const response = await fetch(monitoringUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
      },
      body: JSON.stringify(errorData),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Monitoring service responded with ${response.status}`);
    }

    console.log('Error sent to monitoring service successfully');

  } catch (monitoringError) {
    console.error('Failed to send error to monitoring service:', monitoringError);
  }
}

/**
 * Get error statistics
 */
async function getErrorStatistics() {
  try {
    const errorDir = path.join(__dirname, '../logs/client-errors');
    
    try {
      await fs.access(errorDir);
    } catch {
      return {
        totalErrors: 0,
        errorsByType: {},
        errorsByDay: {},
        recentErrors: 0
      };
    }

    const files = await fs.readdir(errorDir);
    const errorFiles = files.filter(file => file.startsWith('client_error_') && file.endsWith('.json'));

    const stats = {
      totalErrors: errorFiles.length,
      errorsByType: {},
      errorsByDay: {},
      recentErrors: 0
    };

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    for (const file of errorFiles.slice(-100)) { // Process last 100 errors
      try {
        const filepath = path.join(errorDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const errorData = JSON.parse(content);

        // Count by type
        const type = errorData.type || 'unknown';
        stats.errorsByType[type] = (stats.errorsByType[type] || 0) + 1;

        // Count by day
        const day = errorData.serverTimestamp?.split('T')[0] || 'unknown';
        stats.errorsByDay[day] = (stats.errorsByDay[day] || 0) + 1;

        // Count recent errors
        const errorTime = new Date(errorData.serverTimestamp).getTime();
        if (errorTime > oneDayAgo) {
          stats.recentErrors++;
        }

      } catch (parseError) {
        console.error('Failed to parse error file:', file, parseError);
      }
    }

    return stats;

  } catch (statsError) {
    console.error('Failed to generate error statistics:', statsError);
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsByDay: {},
      recentErrors: 0,
      error: statsError.message
    };
  }
}

/**
 * Get recent errors
 */
async function getRecentErrors(limit = 50) {
  try {
    const errorDir = path.join(__dirname, '../logs/client-errors');
    
    try {
      await fs.access(errorDir);
    } catch {
      return [];
    }

    const files = await fs.readdir(errorDir);
    const errorFiles = files
      .filter(file => file.startsWith('client_error_') && file.endsWith('.json'))
      .sort()
      .slice(-limit);

    const errors = [];

    for (const file of errorFiles) {
      try {
        const filepath = path.join(errorDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const errorData = JSON.parse(content);
        
        // Remove sensitive information
        delete errorData.ip;
        delete errorData.userAgent;
        
        errors.push(errorData);

      } catch (parseError) {
        console.error('Failed to parse error file:', file, parseError);
      }
    }

    return errors.reverse(); // Most recent first

  } catch (recentError) {
    console.error('Failed to get recent errors:', recentError);
    return [];
  }
}

/**
 * Cleanup old error files
 */
async function cleanupOldErrors() {
  try {
    const errorDir = path.join(__dirname, '../logs/client-errors');
    
    try {
      await fs.access(errorDir);
    } catch {
      return;
    }

    const files = await fs.readdir(errorDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    for (const file of files) {
      if (file.startsWith('client_error_') && file.endsWith('.json')) {
        const filepath = path.join(errorDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.unlink(filepath);
          console.log('Deleted old error file:', file);
        }
      }
    }

  } catch (cleanupError) {
    console.error('Failed to cleanup old errors:', cleanupError);
  }
}

// Run cleanup daily
setInterval(cleanupOldErrors, 24 * 60 * 60 * 1000);

module.exports = router;