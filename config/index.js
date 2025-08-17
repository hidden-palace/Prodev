const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    assistantId: process.env.ASSISTANT_ID
  },
  webhook: {
    url: process.env.WEBHOOK_URL,
    secret: process.env.WEBHOOK_SECRET
  },
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  maxChainDepth: parseInt(process.env.MAX_CHAIN_DEPTH) || 5, // Max number of assistant hops in a chain
  // AI Employee configurations with PRODUCTION webhook URLs
  employees: {
    brenden: {
      assistantId: 'asst_MvlMZ3IOvQrTkbsENRSzGRwZ',
      name: 'AI Brenden',
      role: 'lead scraper',
      specialty: 'Lead Research Specialist',
      toolWebhooks: {
        scrape_leads: 'https://pccommandcenter.app.n8n.cloud/webhook/705c06e4-c1d4-45b9-beeb-d2e6c98c0b5e',
        name_to_binary: 'https://pccommandcenter.app.n8n.cloud/webhook-test/37fc5750-24c5-4da2-b145-c7ee92d13b94'
      }
    },
    van: {
      assistantId: 'asst_x0WhKHr61IUopNPR7A8No9kK',
      name: 'AI Van',
      role: 'page operator',
      specialty: 'Digital Marketing Designer',
      toolWebhooks: {
        capture_landing_page_requirements: 'https://pccommandcenter.app.n8n.cloud/webhook-test/71791fd2-82db-423e-8a8a-47e90fbd16b9'
      }
    },
    sara: {
      assistantId: 'asst_w2t643MjToTPg3ywB7pYdIuX',
      name: 'AI Sara',
      role: 'Blog Post Writer',
      specialty: 'Blog Post Expert',
      toolWebhooks: {
        placeholder_tool: 'https://your-webhook-url.com/sara'
      }
    },
    rey: {
      assistantId: 'asst_DDzLbSra46dq6WE5UvhCRK5v',
      name: 'AI Rey',
      role: 'Lead Generation Plan Strategist',
      specialty: 'Voice Outreach Manager',
      toolWebhooks: {
        get_competitor_insights: 'https://pccommandcenter.app.n8n.cloud/webhook-test/b072f9a9-c033-404a-8c8e-25b02bbd545a'
      }
    },
    xavier: {
      assistantId: 'asst_6oDeBjbnFlAiagSEJDWHvBtl',
      name: 'AI Xavier',
      role: 'Content Generation AI',
      specialty: 'UGC Expert',
      toolWebhooks: {
        placeholder_tool: 'https://your-webhook-url.com/xavier'
      }
    },
    rhea: {
      assistantId: 'asst_Y9UHKrstNe3H7Z3uhxe5ruEG',
      name: 'AI Rhea',
      role: 'Reputation AI',
      specialty: 'Review Assistant',
      toolWebhooks: {
        placeholder_tool: 'https://your-webhook-url.com/rhea'
      }
    },
    miles: {
      assistantId: 'asst_fhA5p35szgoaXaoHk2v4KmuB',
      name: 'AI Miles',
      role: 'Campaign AI Builder',
      specialty: 'Marketing Campaign Designer',
      toolWebhooks: {
        placeholder_tool: 'https://your-webhook-url.com/miles'
      }
    },
    eden: {
      assistantId: 'asst_Lr3o67bwsM4LzhDef8bbsbCy',
      name: 'AI Eden',
      role: 'Email Occasion Reminder AI',
      specialty: 'Customer Engagement Emails',
      toolWebhooks: {
        placeholder_tool: 'https://your-webhook-url.com/eden'
      }
    },
    angel: {
      assistantId: 'asst_eVAiDpRTPgcfvlhxPQCnH91c',
      name: 'AI Angel',
      role: 'Customer Support AI',
      specialty: 'Handles Customer Queries & Phone Inquiries',
      toolWebhooks: {
        placeholder_tool: 'https://your-webhook-url.com/angel'
      }
    }
  },
  supabase: {
    url: process.env.VITE_SUPABASE_URL,
    anonKey: process.env.VITE_SUPABASE_ANON_KEY
  }
};

// Validate required configuration
const requiredConfig = [
  { key: 'openai.apiKey', value: config.openai.apiKey, name: 'OPENAI_API_KEY' },
  { key: 'supabase.url', value: config.supabase.url, name: 'VITE_SUPABASE_URL' },
  { key: 'supabase.anonKey', value: config.supabase.anonKey, name: 'VITE_SUPABASE_ANON_KEY' }
];

const missingConfig = requiredConfig.filter(item => 
  !item.value || 
  item.value.includes('your_') || 
  item.value === 'your_openai_api_key_here' ||
  item.value === 'your_supabase_project_url_here' ||
  item.value === 'your_supabase_anon_key_here'
);

if (missingConfig.length > 0) {
  if (config.server.nodeEnv === 'development') {
    console.warn('⚠️  Running in demo mode - some features will be limited:');
    missingConfig.forEach(item => {
      console.warn(`   - ${item.name} not configured properly`);
    });
    console.warn('\n   To enable full functionality, please configure your .env file with real values.');
    console.warn('   The server will start but API calls will fail until properly configured.\n');
  } else {
    console.error('Missing or invalid required environment variables:');
    missingConfig.forEach(item => {
      console.error(`- ${item.name}`);
    });
    console.error('\nPlease check your .env file or environment variables.');
    process.exit(1);
  }
}

// Additional validation for API key format
if (config.openai.apiKey && !config.openai.apiKey.startsWith('sk-')) {
  console.error('Invalid OpenAI API key format. API keys should start with "sk-"');
  if (config.server.nodeEnv !== 'development') {
    process.exit(1);
  }
}

// Additional validation for Supabase URL format
if (config.supabase.url && !config.supabase.url.startsWith('https://')) {
  console.error('Invalid Supabase URL format. URLs should start with "https://"');
  if (config.server.nodeEnv !== 'development') {
    process.exit(1);
  }
}

// Additional validation for Supabase Anon Key format
if (config.supabase.anonKey && !config.supabase.anonKey.startsWith('eyJ')) {
  console.error('Invalid Supabase Anon Key format. Keys should start with "eyJ"');
  if (config.server.nodeEnv !== 'development') {
    process.exit(1);
  }
}

// Validate employee webhook URLs
console.log('\n🔗 Employee Webhook Configuration:');
Object.entries(config.employees).forEach(([key, employee]) => {
  const hasToolWebhooks = employee.toolWebhooks && Object.keys(employee.toolWebhooks).length > 0;
  const status = hasToolWebhooks ? '✅' : '⚠️';
  console.log(`   ${status} ${employee.name}:`);
  if (hasToolWebhooks) {
    Object.entries(employee.toolWebhooks).forEach(([toolName, url]) => {
      const urlType = url.includes('webhook-test') ? '(TEST)' : '(PRODUCTION)';
      console.log(`     - Tool '${toolName}': ${url} ${url.includes('placeholder') ? '(PLACEHOLDER)' : urlType}`);
    });
  } else {
    console.log(`     - No tool webhooks configured.`);
  }
});

module.exports = config;