/**
 * Validation middleware for API requests
 */

const validateAskRequest = (req, res, next) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({
      error: 'Missing or invalid message field',
      details: 'Message must be a non-empty string'
    });
  }

  if (message.length > 4000) {
    return res.status(400).json({
      error: 'Message too long',
      details: 'Message must be less than 4000 characters'
    });
  }

  next();
};

const validateWebhookResponse = (req, res, next) => {
  const { tool_call_id, output, thread_id, run_id } = req.body;

  console.log('🔍 Validating webhook response:', {
    tool_call_id: tool_call_id || 'MISSING',
    output_length: output ? output.length : 'MISSING',
    thread_id: thread_id || 'MISSING',
    run_id: run_id || 'MISSING'
  });

  // ENHANCED: Check for empty strings as well as missing values
  const requiredFields = [
    { field: 'tool_call_id', value: tool_call_id, valid: tool_call_id && tool_call_id.trim() !== '' },
    { field: 'output', value: output, valid: output !== undefined && output !== null },
    { field: 'thread_id', value: thread_id, valid: thread_id && thread_id.trim() !== '' },
    { field: 'run_id', value: run_id, valid: run_id && run_id.trim() !== '' }
  ];

  const invalidFields = requiredFields.filter(item => !item.valid);

  if (invalidFields.length > 0) {
    console.error('❌ Webhook validation failed:', invalidFields.map(f => `${f.field}: ${f.value || 'missing'}`));
    return res.status(400).json({
      error: 'Missing or invalid required fields',
      details: `Invalid fields: ${invalidFields.map(f => f.field).join(', ')}`,
      received_data: {
        tool_call_id: tool_call_id || null,
        thread_id: thread_id || null,
        run_id: run_id || null,
        output_present: !!output
      }
    });
  }

  // Validate field types
  if (typeof tool_call_id !== 'string' || typeof thread_id !== 'string' || typeof run_id !== 'string') {
    return res.status(400).json({
      error: 'Invalid field types',
      details: 'tool_call_id, thread_id, and run_id must be strings'
    });
  }

  console.log('✅ Webhook validation passed');
  next();
};

module.exports = {
  validateAskRequest,
  validateWebhookResponse
};
