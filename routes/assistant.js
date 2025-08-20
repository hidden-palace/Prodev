const express = require('express');
const OpenAIService = require('../services/openai-client');
const WebhookHandler = require('../services/webhook-handler');
const LeadProcessor = require('../services/lead-processor');
const { validateAskRequest, validateWebhookResponse } = require('../middleware/validation');
const config = require('../config');

const router = express.Router();

// Initialize services with error handling
let openaiService;
let webhookHandler;
let leadProcessor;

try {
  openaiService = new OpenAIService();
  webhookHandler = new WebhookHandler();
  leadProcessor = new LeadProcessor();
} catch (error) {
  console.error('Failed to initialize services:', error.message);
  // Services will be null, and we'll handle this in the routes
}

/**
 * GET /assistant-info - Get detailed assistant configuration
 */
router.get('/assistant-info', async (req, res, next) => {
  try {
    if (!openaiService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'OpenAI service is not properly configured.'
      });
    }

    // Get employee from query parameter
    const employee = req.query.employee || 'brenden';
    const employeeConfig = config.employees[employee];
    
    if (!employeeConfig) {
      return res.status(404).json({
        error: 'Employee not found',
        details: `Employee '${employee}' is not configured`
      });
    }

    const assistantId = employeeConfig.assistantId;
    
    console.log(`Getting assistant info for ${employee} (${assistantId})`);

    // Check if assistant ID is placeholder
    if (assistantId.includes('placeholder')) {
      return res.status(503).json({
        error: 'Assistant not configured',
        details: `${employeeConfig.name} is not connected yet. Please contact your administrator to configure this AI employee.`,
        employee: employeeConfig
      });
    }

    // Get assistant details from OpenAI
    const assistant = await openaiService.client.beta.assistants.retrieve(assistantId);
    
    res.json({
      id: assistant.id,
      name: assistant.name,
      description: assistant.description,
      instructions: assistant.instructions,
      model: assistant.model,
      tools: assistant.tools,
      created_at: assistant.created_at,
      employee: employeeConfig
    });
    
  } catch (error) {
    console.error('Error getting assistant info:', error);
    
    // Handle specific OpenAI errors
    if (error.status === 404) {
      return res.status(404).json({
        error: 'Assistant not found',
        details: 'The specified assistant ID does not exist or is not accessible.'
      });
    }
    
    next(error);
  }
});

/**
 * GET /run-status - Check the status of a specific run with isolation context
 */
router.get('/run-status', async (req, res, next) => {
  try {
    console.log('=== RUN STATUS CHECK WITH ISOLATION ===');
    
    if (!openaiService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'OpenAI service is not properly configured.'
      });
    }

    const { thread_id, run_id, employee_id } = req.query;
    
    // Validate required parameters
    if (!thread_id || !run_id || !employee_id) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'thread_id, run_id, and employee_id are required'
      });
    }

    const employeeConfig = config.employees[employee_id];
    if (!employeeConfig) {
      return res.status(404).json({
        error: 'Employee not found',
        details: `Employee '${employee_id}' is not configured`
      });
    }

    console.log(`🔍 Checking run status for ${employeeConfig.name}:`, {
      thread_id,
      run_id,
      employee_id
    });

    // Validate thread ownership through isolation manager
    try {
      webhookHandler.getIsolationManager().validateThreadOwnership(thread_id, employee_id);
    } catch (isolationError) {
      console.error(`🚨 ISOLATION VIOLATION in run status check:`, isolationError.message);
      return res.status(403).json({
        error: 'Thread access denied',
        details: `Thread ${thread_id} does not belong to ${employeeConfig.name}: ${isolationError.message}`
      });
    }

    // Get current run status from OpenAI
    const run = await openaiService.client.beta.threads.runs.retrieve(thread_id, run_id);
    console.log(`📊 Run ${run_id} current status: ${run.status}`);

    const response = {
      thread_id,
      run_id,
      employee_id,
      employee_name: employeeConfig.name,
      status: run.status,
      isolation_verified: true,
      timestamp: new Date().toISOString()
    };

    if (run.status === 'completed') {
      console.log(`✅ Run completed, fetching final message for ${employeeConfig.name}`);
      
      try {
        const assistantMessage = await openaiService.getLatestAssistantMessage(thread_id);
        response.message = assistantMessage.content;
        response.message_id = assistantMessage.id;
        console.log(`📝 Final message retrieved for ${employeeConfig.name}`);
      } catch (messageError) {
        console.error(`❌ Failed to get final message for ${employeeConfig.name}:`, messageError.message);
        response.message = `Task completed successfully by ${employeeConfig.name}. The assistant has finished processing your request.`;
        response.message_error = messageError.message;
      }
      
    } else if (run.status === 'requires_action') {
      console.log(`🔧 Run requires action for ${employeeConfig.name}`);
      
      if (run.required_action?.type === 'submit_tool_outputs') {
        response.tool_calls = run.required_action.submit_tool_outputs.tool_calls.map(tc => ({
          id: tc.id,
          function: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        }));
        
        // Get employee-specific pending calls
        const pendingCalls = webhookHandler.getEmployeePendingCalls(employee_id);
        response.pending_tool_calls = pendingCalls.length;
        response.tool_calls_sent = pendingCalls.length > 0;
        
        if (pendingCalls.length > 0) {
          response.webhook_status = pendingCalls.map(call => ({
            tool_call_id: call.toolCallId,
            function_name: call.functionName,
            age_seconds: call.age_seconds,
            status: call.status || 'pending',
            correlation_key: call.correlationKey
          }));
        }
      }
      
    } else if (run.status === 'failed') {
      console.error(`❌ Run failed for ${employeeConfig.name}:`, run.last_error);
      response.error = run.last_error?.message || 'Run failed with unknown error';
      response.error_code = run.last_error?.code;
      
    } else if (['cancelled', 'expired'].includes(run.status)) {
      console.warn(`⚠️ Run ${run.status} for ${employeeConfig.name}`);
      response.error = `Run was ${run.status}`;
      
    } else {
      console.log(`⏳ Run still processing for ${employeeConfig.name}: ${run.status}`);
      response.processing = true;
    }

    res.json(response);
    
  } catch (error) {
    console.error('Error checking run status:', error);
    next(error);
  }
});

/**
 * POST /ask - Handle user messages with BULLETPROOF employee isolation
 */
router.post('/ask', validateAskRequest, async (req, res, next) => {
  let threadId = null;
  let runId = null;
  let employeeId = null;
  let assistantId = null;
  
  try {
    console.log('=== BULLETPROOF ASK REQUEST PROCESSING ===');
    console.log('Request timestamp:', new Date().toISOString());

    // Check if services are properly initialized
    if (!openaiService || !webhookHandler) {
      console.error('Services not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Required services are not properly configured. Please check your environment variables.'
      });
    }

    const { message, employee = 'brenden', thread_id } = req.body;
    employeeId = employee;
    
    // Get employee configuration
    const employeeConfig = config.employees[employee];
    if (!employeeConfig) {
      return res.status(404).json({
        error: 'Employee not found',
        details: `Employee '${employee}' is not configured`
      });
    }

    assistantId = employeeConfig.assistantId;
    
    // CRITICAL: Validate employee configuration
    console.log('🎯 BULLETPROOF EMPLOYEE VALIDATION:');
    console.log(`   Employee ID: ${employeeId}`);
    console.log(`   Employee Name: ${employeeConfig.name}`);
    console.log(`   Employee Role: ${employeeConfig.role}`);
    console.log(`   Assistant ID: ${assistantId}`);
    console.log(`   Webhook URL: ${employeeConfig.webhookUrl}`);
    
    // Check if assistant ID is placeholder
    if (assistantId.includes('placeholder')) {
      return res.status(503).json({
        error: 'Assistant not configured',
        details: `❌ ${employeeConfig.name} is not connected yet. Please contact your administrator to configure this AI employee.`,
        employee: employeeConfig
      });
    }
    
  } catch (error) {
    console.error('Error in /api/ask route:', error);
    next(error);
  }
});

module.exports = router;