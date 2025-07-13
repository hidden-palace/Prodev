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
    const exceptionData = {
      ...req.body,
      serverTimestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.requestId || `error_${Date.now()}`
    };

    // Log to console
    console.error('CLIENT_EXCEPTION:', JSON.stringify(exceptionData, null, 2));

    // Store error for analysis
    await storeClientException(exceptionData);

    // Send to monitoring service if configured
    if (process.env.ERROR_MONITORING_URL) {
      await sendToMonitoringService(exceptionData);
    }

    res.json({
      success: true,
      message: 'Exception logged successfully',
      exceptionId: exceptionData.requestId
    });

  } catch (loggingException) {
    console.error('Failed to log client exception:', loggingException);
    next(loggingException);
  }
});

/**
 * GET /errors/stats - Get exception statistics
 */
router.get('/errors/stats', async (req, res, next) => {
  try {
    const stats = await getExceptionStatistics();
    res.json(stats);
  } catch (statsException) {
    console.error('Failed to get exception statistics:', statsException);
    next(statsException);
  }
});

/**
 * GET /errors/recent - Get recent exceptions
 */
router.get('/errors/recent', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const recentExceptionsList = await getRecentExceptions(limit);
    res.json(recentExceptionsList);
  } catch (recentException) {
    console.error('Failed to get recent exceptions:', recentException);
    next(recentException);
  }
});

/**
 * Store client exception for analysis
 */
async function storeClientException(exceptionData) {
  try {
    const exceptionDir = path.join(__dirname, '../logs/client-exceptions');
    
    // Ensure directory exists
    try {
      await fs.access(exceptionDir);
    } catch {
      await fs.mkdir(exceptionDir, { recursive: true });
    }

    // Store exception with timestamp
    const filename = `client_exception_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.json`;
    const filepath = path.join(exceptionDir, filename);
    
    await fs.writeFile(filepath, JSON.stringify(exceptionData, null, 2));
    console.log('Client exception stored:', filepath);

    // Also append to daily log file
    const dailyLogFile = path.join(exceptionDir, `exceptions_${new Date().toISOString().split('T')[0]}.log`);
    const logEntry = `${exceptionData.serverTimestamp} - ${exceptionData.type || 'unknown'} - ${exceptionData.message || 'No message'}\n`;
    
    await fs.appendFile(dailyLogFile, logEntry);

  } catch (storageException) {
    console.error('Failed to store client exception:', storageException);
  }
}

/**
 * Send exception to external monitoring service
 */
async function sendToMonitoringService(exceptionData) {
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
      body: JSON.stringify(exceptionData),
      timeout: 5000
    });

    if (!response.ok) {
      throw new Error(`Monitoring service responded with ${response.status}`);
    }

    console.log('Exception sent to monitoring service successfully');

  } catch (monitoringException) {
    console.error('Failed to send exception to monitoring service:', monitoringException);
  }
}

/**
 * Get exception statistics
 */
async function getExceptionStatistics() {
  try {
    const exceptionDir = path.join(__dirname, '../logs/client-exceptions');
    
    try {
      await fs.access(exceptionDir);
    } catch {
      return {
        totalExceptions: 0,
        exceptionsByType: {},
        exceptionsByDay: {},
        recentExceptions: 0
      };
    }

    const files = await fs.readdir(exceptionDir);
    const exceptionFiles = files.filter(file => file.startsWith('client_exception_') && file.endsWith('.json'));

    const stats = {
      totalExceptions: exceptionFiles.length,
      exceptionsByType: {},
      exceptionsByDay: {},
      recentExceptions: 0
    };

    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

    for (const file of exceptionFiles.slice(-100)) { // Process last 100 exceptions
      try {
        const filepath = path.join(exceptionDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const exceptionData = JSON.parse(content);

        // Count by type
        const type = exceptionData.type || 'unknown';
        stats.exceptionsByType[type] = (stats.exceptionsByType[type] || 0) + 1;

        // Count by day
        const day = exceptionData.serverTimestamp?.split('T')[0] || 'unknown';
        stats.exceptionsByDay[day] = (stats.exceptionsByDay[day] || 0) + 1;

        // Count recent exceptions
        const exceptionTime = new Date(exceptionData.serverTimestamp).getTime();
        if (exceptionTime > oneDayAgo) {
          stats.recentExceptions++;
        }

      } catch (parseException) {
        console.error('Failed to parse exception file:', file, parseException);
      }
    }

    return stats;

  } catch (statsException) {
    console.error('Failed to generate exception statistics:', statsException);
    return {
      totalExceptions: 0,
      exceptionsByType: {},
      exceptionsByDay: {},
      recentExceptions: 0,
      exception: statsException.message
    };
  }
}

/**
 * Get recent exceptions
 */
async function getRecentExceptions(limit = 50) {
  try {
    const exceptionDir = path.join(__dirname, '../logs/client-exceptions');
    
    try {
      await fs.access(exceptionDir);
    } catch {
      return [];
    }

    const files = await fs.readdir(exceptionDir);
    const exceptionFiles = files
      .filter(file => file.startsWith('client_exception_') && file.endsWith('.json'))
      .sort()
      .slice(-limit);

    const recentExceptionsList = [];

    for (const file of exceptionFiles) {
      try {
        const filepath = path.join(exceptionDir, file);
        const content = await fs.readFile(filepath, 'utf8');
        const exceptionData = JSON.parse(content);
        
        // Remove sensitive information
        delete exceptionData.ip;
        delete exceptionData.userAgent;
        
        recentExceptionsList.push(exceptionData);

      } catch (parseException) {
        console.error('Failed to parse exception file:', file, parseException);
      }
    }

    return recentExceptionsList.reverse(); // Most recent first

  } catch (recentException) {
    console.error('Failed to get recent exceptions:', recentException);
    return [];
  }
}

/**
 * Cleanup old exception files
 */
async function cleanupOldExceptions() {
  try {
    const exceptionDir = path.join(__dirname, '../logs/client-exceptions');
    
    try {
      await fs.access(exceptionDir);
    } catch {
      return;
    }

    const files = await fs.readdir(exceptionDir);
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);

    for (const file of files) {
      if (file.startsWith('client_exception_') && file.endsWith('.json')) {
        const filepath = path.join(exceptionDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime.getTime() < thirtyDaysAgo) {
          await fs.unlink(filepath);
          console.log('Deleted old exception file:', file);
        }
      }
    }

  } catch (cleanupException) {
    console.error('Failed to cleanup old exceptions:', cleanupException);
  }
}

// Run cleanup daily
setInterval(cleanupOldExceptions, 24 * 60 * 60 * 1000);

module.exports = router;