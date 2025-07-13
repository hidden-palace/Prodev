/**
 * Request validation middleware
 */

// Validate payload for /api/ask
function validateAskRequest(req, res, next) {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({
      error: 'Invalid request: "message" is required and must be a string.'
    });
  }

  next();
}

// Validate payload for /api/webhook-response
function validateWebhookResponse(req, res, next) {
  const { tool_call_id, output, thread_id, run_id } = req.body;

  if (!tool_call_id || !output || !thread_id || !run_id) {
    return res.status(400).json({
      error: 'Invalid webhook response: Missing required fields.'
    });
  }

  next();
}

module.exports = {
  validateAskRequest,
  validateWebhookResponse
};
