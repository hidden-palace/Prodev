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
 * Core function to process an assistant interaction, including chaining.
 * This function handles thread management, message adding, running/polling assistants,
 * and recursively calls itself for chaining if configured.
 */
async function processAssistantInteraction({ message, employeeId, threadId = null, runId = null, chainHistory = [] }) {
  let currentThreadId = threadId;
  let currentRunId = runId;
  const employeeConfig = config.employees[employeeId];
  const assistantId = employeeConfig.assistantId;

  // CRITICAL: Validate employee configuration
  if (!employeeConfig) {
    throw { status: 404, error: 'Employee not found', details: `Employee '${employeeId}' is not configured` };
  }
  if (assistantId.includes('placeholder')) {
    throw {
      status: 503,
      error: 'Assistant not configured',
      details: `❌ ${employeeConfig.name} is not connected yet. Please contact your administrator to configure this AI employee.`,
      employee: employeeConfig
    };
  }

  // 1. Thread Management: Create new thread or validate existing one
  if (!currentThreadId) {
    console.log('Step 1: Creating new thread with isolation...');
    const thread = await openaiService.createThread();
    currentThreadId = thread.id;
    webhookHandler.getIsolationManager().createConversationThread(employeeId, currentThreadId);
    console.log(`✅ Thread created and registered for ${employeeConfig.name}:`, currentThreadId);
  } else {
    console.log('Step 1: Using existing thread with isolation validation:', currentThreadId);
    try {
      webhookHandler.getIsolationManager().validateThreadOwnership(currentThreadId, employeeId);
      console.log(`✅ Thread ownership validated for ${employeeConfig.name}`);
    } catch (isolationError) {
      console.error(`🚨 CRITICAL ISOLATION VIOLATION:`, isolationError.message);
      throw {
        status: 403,
        error: 'Thread access denied',
        details: `Thread ${currentThreadId} does not belong to ${employeeConfig.name}. This is a critical isolation violation.`,
        employee: employeeConfig,
        isolation_error: isolationError.message
      };
    }
    // Check for active runs on this thread ONLY if a new message is being added
    if (message) {
      console.log('🔍 Checking for active runs on thread...');
      const runs = await openaiService.client.beta.threads.runs.list(currentThreadId, { limit: 1 });
      if (runs.data.length > 0) {
        const latestRun = runs.data[0];
        console.log(`📊 Latest run status: ${latestRun.status} (${latestRun.id})`);
        if (['queued', 'in_progress', 'requires_action'].includes(latestRun.status)) {
          console.log(`⚠️ Thread ${currentThreadId} has active run ${latestRun.id} with status: ${latestRun.status}`);
          if (latestRun.status === 'requires_action') {
            const pendingCalls = webhookHandler.getEmployeePendingCalls(employeeId);
            if (pendingCalls.length > 0) {
              throw {
                status: 409,
                error: 'Thread busy with tool calls',
                details: `${employeeConfig.name} is currently processing ${pendingCalls.length} tool call(s). Please wait for completion.`,
                thread_id: currentThreadId,
                run_id: latestRun.id,
                pending_tool_calls: pendingCalls.length,
                employee: employeeConfig,
                current_status: 'requires_action'
              };
            }
          } else {
            throw {
              status: 409,
              error: 'Thread busy',
              details: `${employeeConfig.name} is currently processing another request. Please wait for completion.`,
              thread_id: currentThreadId,
              run_id: latestRun.id,
              current_status: latestRun.status,
              employee: employeeConfig
            };
          }
        }
      }
    }
  }

  // 2. Add Message (if provided)
  if (message) {
    console.log('Step 2: Adding message to thread...');
    await openaiService.addMessage(currentThreadId, message);
    console.log('✅ Message added to thread successfully');
  }

  // 3. Run Assistant or Continue Run
  if (!currentRunId) { // Only start a new run if no runId provided
    console.log(`Step 3: Running ${employeeConfig.name}'s assistant (${assistantId})...`);
    const run = await openaiService.runAssistant(currentThreadId, assistantId);
    currentRunId = run.id;
    console.log(`✅ ${employeeConfig.name}'s assistant run started:`, currentRunId);
  }

  // 4. Poll for completion
  console.log(`Step 4: Polling for ${employeeConfig.name}'s completion...`);
  const pollResult = await openaiService.pollRunStatus(currentThreadId, currentRunId, 20, 2000); // 40 seconds max
  console.log(`✅ ${employeeConfig.name} polling completed, result status:`, pollResult.status);

  // 5. Handle Result and Chaining
  if (pollResult.status === 'completed') {
    console.log(`✅ ${employeeConfig.name} completed without tool calls`);
    const assistantMessage = await openaiService.getLatestAssistantMessage(currentThreadId);

    const response = {
      status: 'completed',
      message: assistantMessage.content,
      thread_id: currentThreadId,
      run_id: currentRunId,
      assistant_id: assistantId,
      employee: employeeConfig,
      chain_path: [...chainHistory, employeeId], // Add current employee to path
      isolation_verified: true,
      timestamp: new Date().toISOString()
    };

    // --- Chaining Logic ---
    if (employeeConfig.chainsTo && chainHistory.length < config.maxChainDepth) {
      const nextEmployeeId = employeeConfig.chainsTo;
      if (config.employees[nextEmployeeId] && !chainHistory.includes(nextEmployeeId)) {
        console.log(`🔗 Chaining from ${employeeId} to ${nextEmployeeId}`);
        // Use the assistant's message as the new user message for the next assistant
        return await processAssistantInteraction({
          message: assistantMessage.content,
          employeeId: nextEmployeeId,
          threadId: currentThreadId, // Continue on the same thread
          chainHistory: [...chainHistory, employeeId] // Pass updated chain history
        });
      } else if (chainHistory.includes(nextEmployeeId)) {
        console.warn(`⚠️ Chain loop detected: ${nextEmployeeId} already in chain history. Stopping chain.`);
      } else {
        console.warn(`⚠️ Next employee ${nextEmployeeId} not found in configuration. Stopping chain.`);
      }
    }
    // --- End Chaining Logic ---

    return response; // Return final response if no chaining or chain stopped

  } else if (pollResult.status === 'requires_action') {
    console.log(`🔧 ${employeeConfig.name} requires tool calls:`, pollResult.toolCalls?.length || 0);

    // Validate employee-specific webhook configuration
    if (!employeeConfig.webhookUrl || employeeConfig.webhookUrl.includes('placeholder')) {
      console.error(`❌ Webhook URL not configured for ${employeeConfig.name}`);
      throw {
        status: 503,
        error: 'Webhook not configured',
        details: `External webhook URL is not configured for ${employeeConfig.name}. Tool calls cannot be processed.`,
        employee: employeeConfig,
        tool_calls: pollResult.toolCalls.map(tc => ({
          id: tc.id,
          function: tc.function.name,
          arguments: JSON.parse(tc.function.arguments)
        })),
        thread_id: currentThreadId,
        run_id: currentRunId
      };
    }

    // CRITICAL: Send to CORRECT employee's webhook with bulletproof isolation
    console.log(`=== SENDING TOOL CALLS TO ${employeeConfig.name.toUpperCase()}'S WEBHOOK ===`);
    console.log(`🎯 BULLETPROOF WEBHOOK ROUTING:`);
    console.log(`   Employee: ${employeeConfig.name}`);
    console.log(`   Webhook URL: ${employeeConfig.webhookUrl}`);
    console.log(`   Tool Calls: ${pollResult.toolCalls.length}`);
    console.log(`   Thread ID: ${currentThreadId}`);
    console.log(`   Run ID: ${currentRunId}`);

    const webhookResults = await webhookHandler.sendToolCalls(
      pollResult.toolCalls,
      currentThreadId,
      currentRunId,
      employeeId // CRITICAL: Correct employee ID
    );
    console.log(`✅ Tool calls sent to ${employeeConfig.name}'s webhook successfully`);

    return {
      status: 'requires_action',
      message: `Tool calls have been sent to ${employeeConfig.name}'s external webhook`,
      thread_id: currentThreadId,
      run_id: currentRunId,
      assistant_id: assistantId,
      employee: employeeConfig,
      tool_calls: pollResult.toolCalls.map(tc => ({
        id: tc.id,
        function: tc.function.name,
        arguments: JSON.parse(tc.function.arguments)
      })),
      webhook_results: webhookResults,
      isolation_verified: true,
      chain_path: [...chainHistory, employeeId],
      timestamp: new Date().toISOString()
    };
  } else {
    console.error('Unexpected result status:', pollResult.status);
    throw new Error(`Unexpected assistant status: ${pollResult.status}`);
  }
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
  try {
    console.log('=== NEW ASK REQUEST WITH BULLETPROOF ISOLATION ===');
    
    if (!openaiService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'OpenAI service is not properly configured.'
      });
    }

    const { message, employee: employeeId, thread_id: threadId } = req.body;
    
    console.log(`🎯 Processing request for employee: ${employeeId}`);
    console.log(`📝 Message: ${message}`);
    console.log(`🧵 Thread ID: ${threadId || 'new thread'}`);

    const result = await processAssistantInteraction({ message, employeeId, threadId });
    res.json(result);
  } catch (error) {
    console.error('❌ Error in /api/ask endpoint:', error);
    if (error && typeof error === 'object' && error.status) {
      return res.status(error.status).json(error);
    }
    next(error);
  }
});

/**
 * POST /webhook-response - Handle webhook responses with BULLETPROOF isolation
 */
router.post('/webhook-response', validateWebhookResponse, async (req, res, next) => {
  try {
    const processedResponse = webhookHandler.processWebhookResponse(req.body);

    // Check if this is lead data and process it
    if (leadProcessor && leadProcessor.isLeadData(processedResponse.output)) {
      console.log(`🎯 Detected lead data from ${processedResponse.employee_name}, processing...`);
      try {
        const leadResult = await leadProcessor.processLeadData(
          processedResponse.output,
          processedResponse.employee_id
        );
        console.log(`✅ Successfully processed ${leadResult.count} leads from ${processedResponse.employee_name}`);
        
        processedResponse.lead_processing = {
          detected: true,
          processed: leadResult.success,
          count: leadResult.count,
          message: leadResult.message
        };
      } catch (leadError) {
        console.error(`❌ Failed to process leads from ${processedResponse.employee_name}:`, leadError.message);
        processedResponse.lead_processing = {
          detected: true,
          processed: false,
          error: leadError.message
        };
      }
    } else {
      processedResponse.lead_processing = {
        detected: false,
        processed: false
      };
    }

    // Submit tool output back to OpenAI
    console.log(`🚀 Submitting tool output to OpenAI for ${processedResponse.employee_name}`);
    await openaiService.submitToolOutputs(
      processedResponse.thread_id,
      processedResponse.run_id,
      [{
        tool_call_id: processedResponse.tool_call_id,
        output: processedResponse.output
      }]
    );
    console.log(`✅ Tool output submitted successfully for ${processedResponse.employee_name}.`);

    // Continue the run and potentially trigger chaining
    const finalChainResult = await processAssistantInteraction({
      message: null, // No new user message, just continue the run
      employeeId: processedResponse.employee_id,
      threadId: processedResponse.thread_id,
      runId: processedResponse.run_id,
      chainHistory: [] // Start fresh chain history for this internal continuation
    });
    res.json(finalChainResult);
  } catch (error) {
    console.error('❌ Error in /api/webhook-response endpoint:', error);
    if (error && typeof error === 'object' && error.status) {
      return res.status(error.status).json(error);
    }
    next(error);
  }
});

/**
 * GET /status - Get server status with isolation information
 */
router.get('/status', async (req, res) => {
  try {
    const pendingCalls = webhookHandler ? webhookHandler.getPendingCalls() : [];
    
    // Check webhook health for all employees if configured
    let webhookHealth = null;
    if (webhookHandler) {
      try {
        webhookHealth = await webhookHandler.checkWebhookHealth();
      } catch (error) {
        webhookHealth = { error: error.message };
      }
    }
    
    // Get comprehensive statistics with isolation info
    const stats = webhookHandler ? webhookHandler.getStatistics() : null;
    
    // Get lead statistics if available
    let leadStats = null;
    if (leadProcessor) {
      try {
        leadStats = await leadProcessor.getStatistics();
      } catch (error) {
        leadStats = { error: error.message };
      }
    }

    // Get isolation integrity status
    let isolationIntegrity = null;
    if (webhookHandler) {
      try {
        isolationIntegrity = webhookHandler.validateSystemIntegrity();
      } catch (error) {
        isolationIntegrity = { error: error.message };
      }
    }
    
    const response = {
      status: 'running',
      employees: config.employees,
      services_initialized: {
        openai: !!openaiService,
        webhook: !!webhookHandler,
        leads: !!leadProcessor,
        isolation: !!(webhookHandler && webhookHandler.getIsolationManager())
      },
      configuration: {
        api_key_configured: !!(config.openai.apiKey && !config.openai.apiKey.includes('your_')),
        employees_configured: Object.keys(config.employees).reduce((acc, key) => {
          const employee = config.employees[key];
          acc[key] = {
            assistant_configured: !employee.assistantId.includes('placeholder'),
            webhook_configured: !!(employee.webhookUrl && !employee.webhookUrl.includes('placeholder')),
            name: employee.name,
            role: employee.role
          };
          return acc;
        }, {})
      },
      webhook_health: webhookHealth,
      pending_tool_calls: pendingCalls.length,
      pending_calls: pendingCalls,
      statistics: stats,
      lead_statistics: leadStats,
      isolation_integrity: isolationIntegrity,
      isolation_enabled: true,
      timestamp: new Date().toISOString()
    };

    console.log('📊 Status request - response summary:', {
      total_employees: Object.keys(config.employees).length,
      pending_calls: pendingCalls.length,
      isolation_healthy: isolationIntegrity?.healthy || false,
      total_leads: leadStats?.total || 0
    });
    res.json(response);
  } catch (error) {
    console.error('Error in status endpoint:', error);
    res.status(500).json({
      error: 'Failed to get status',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /debug/isolation - Debug endpoint for isolation system
 */
router.get('/debug/isolation', (req, res) => {
  try {
    if (!webhookHandler) {
      return res.status(503).json({ 
        error: 'Webhook handler not initialized',
        details: 'Service is not properly configured',
        timestamp: new Date().toISOString()
      });
    }
    
    const isolationManager = webhookHandler.getIsolationManager();
    const stats = isolationManager.getIsolationStatistics();
    const integrity = isolationManager.validateIsolationIntegrity();
    
    const response = {
      isolation_statistics: stats,
      integrity_check: integrity,
      employee_contexts: Object.keys(config.employees).reduce((acc, empId) => {
        acc[empId] = isolationManager.getEmployeeContext(empId);
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Debug isolation request:', {
      total_employees: stats.totalEmployees,
      total_threads: stats.totalActiveThreads,
      total_pending: stats.totalPendingOperations,
      isolation_healthy: integrity.healthy
    });
    res.json(response);
  } catch (error) {
    console.error('Error in debug isolation endpoint:', error);
    res.status(500).json({
      error: 'Failed to get isolation debug info',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /debug/reset-employee - Emergency reset for specific employee
 */
router.post('/debug/reset-employee', (req, res) => {
  try {
    const { employee_id } = req.body;
    
    if (!employee_id) {
      return res.status(400).json({
        error: 'Missing employee_id',
        details: 'employee_id is required for reset operation'
      });
    }
    
    if (!webhookHandler) {
      return res.status(503).json({ 
        error: 'Webhook handler not initialized',
        details: 'Service is not properly configured'
      });
    }
    
    console.log(`🚨 EMERGENCY RESET requested for employee: ${employee_id}`);
    
    const resetResult = webhookHandler.emergencyResetEmployee(employee_id);
    
    res.json({
      status: 'success',
      message: `Employee ${employee_id} context has been reset`,
      employee_name: resetResult.name,
      reset_timestamp: new Date().toISOString(),
      new_isolation_key: resetResult.isolationKey
    });
    
  } catch (error) {
    console.error('Error in emergency reset:', error);
    res.status(500).json({
      error: 'Failed to reset employee',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;