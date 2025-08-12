/**
 * 🤖 AI Employee Multi-Chat System
 * Handles simultaneous conversations with multiple AI employees
 * 
 * Architecture:
 * - Per-employee chat containers
 * - Independent state management
 * - Concurrent API calls
 * - Thread persistence
 */

// 🔧 Employee Configuration (matches backend config/index.js)
const EMPLOYEES = {
  brenden: {
    id: 'brenden',
    name: 'AI Brenden',
    role: 'Lead Research Specialist',
    description: 'Specialist in lead research and data scraping. I help you find and qualify potential customers with detailed market research.',
    avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    quickActions: [
      { icon: '🎯', text: 'Find Tech Leads', message: 'Find leads for tech startups in California' },
      { icon: '🔍', text: 'Research Competitors', message: 'Research competitors in my industry' },
      { icon: '✅', text: 'Qualify Leads', message: 'Generate lead qualification criteria' },
      { icon: '📧', text: 'Outreach Strategy', message: 'Create outreach strategy' }
    ]
  },
  van: {
    id: 'van',
    name: 'AI Van',
    role: 'Digital Marketing Designer',
    description: 'Creative marketing specialist focused on landing page design and digital marketing strategies.',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    quickActions: [
      { icon: '🎨', text: 'Design Landing Page', message: 'Create a high-converting landing page design' },
      { icon: '📱', text: 'Social Media Strategy', message: 'Develop a social media marketing strategy' },
      { icon: '🚀', text: 'Campaign Ideas', message: 'Generate digital marketing campaign ideas' },
      { icon: '📊', text: 'Marketing Analytics', message: 'Analyze marketing performance metrics' }
    ]
  },
  Rey: {
    id: 'Rey',
    name: 'AI Rey',
    role: 'Lead Generation Plan Strategist',
    description: 'Strategic planning specialist for lead generation and business development initiatives.',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg',
    quickActions: [
      { icon: '📋', text: 'Generate Strategy', message: 'Create a comprehensive lead generation strategy' },
      { icon: '🎯', text: 'Target Analysis', message: 'Analyze target audience and market segments' },
      { icon: '📈', text: 'Growth Plan', message: 'Develop a business growth plan' },
      { icon: '🔄', text: 'Process Optimization', message: 'Optimize our lead generation process' }
    ]
  },
  Xavier: {
    id: 'Xavier',
    name: 'AI Xavier',
    role: 'UGC Expert',
    description: 'User-generated content specialist focused on content creation and community engagement strategies.',
    avatar: 'https://images.pexels.com/photos/2100063/pexels-photo-2100063.jpeg',
    quickActions: [
      { icon: '📱', text: 'Content Ideas', message: 'Generate user-generated content ideas' },
      { icon: '🎬', text: 'Video Strategy', message: 'Create a UGC video marketing strategy' },
      { icon: '👥', text: 'Community Building', message: 'Develop community engagement strategies' },
      { icon: '📝', text: 'Content Calendar', message: 'Plan a UGC content calendar' }
    ]
  }
};

// 🔄 Global State Management
let employeeStates = {
  brenden: { isLoading: false, threadId: null, messageCount: 0 },
  van: { isLoading: false, threadId: null, messageCount: 0 },
  Rey: { isLoading: false, threadId: null, messageCount: 0 },
  Xavier: { isLoading: false, threadId: null, messageCount: 0 }
};

// 📱 Active Chat Management
let activeChats = new Set(); // Tracks which chats are currently open

// 🚀 Initialize Application
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 AI Employee Multi-Chat System Initializing...');
  console.log('🔍 DEBUG: Available employees:', Object.keys(EMPLOYEES));
  console.log('🔍 DEBUG: Xavier config:', EMPLOYEES.Xavier);
  initializeEmployeeProfiles();
  setupGlobalEventListeners();
  console.log('✅ Multi-Chat System Ready!');
});

/**
 * 👥 Initialize Employee Profiles in Sidebar
 */
function initializeEmployeeProfiles() {
  const teamMembersContainer = document.querySelector('.team-members');
  if (!teamMembersContainer) {
    console.error('❌ Team members container not found');
    return;
  }

  console.log('🔍 DEBUG: Team members container found:', teamMembersContainer);
  teamMembersContainer.innerHTML = ''; // Clear existing content

  Object.values(EMPLOYEES).forEach(employee => {
    console.log('🔍 DEBUG: Creating profile for:', employee.name, employee.id);
    const memberElement = createEmployeeProfileElement(employee);
    teamMembersContainer.appendChild(memberElement);
  });

  console.log('✅ Employee profiles initialized');
  console.log('🔍 DEBUG: Total profiles created:', teamMembersContainer.children.length);
}

/**
 * 🏗️ Create Employee Profile Element
 */
function createEmployeeProfileElement(employee) {
  console.log('🔍 DEBUG: Creating profile element for:', employee.name);
  const memberDiv = document.createElement('div');
  memberDiv.className = 'team-member';
  memberDiv.dataset.employeeId = employee.id;
  
  memberDiv.innerHTML = `
    <div class="member-avatar">
      <img src="${employee.avatar}" alt="${employee.name}">
      <div class="status-indicator online"></div>
    </div>
    <div class="member-info">
      <div class="member-name">${employee.name}</div>
      <div class="member-role">${employee.role}</div>
      <div class="member-tags">
        <span class="tag specialist">Active</span>
      </div>
    </div>
    <div class="member-stats">
      <div class="notification-badge" id="badge-${employee.id}" style="display: none;">0</div>
    </div>
  `;

  // Add click event listener
  memberDiv.addEventListener('click', () => {
    console.log(`👤 Opening chat with ${employee.name} (${employee.id})`);
    openEmployeeChat(employee.id);
  });

  console.log('✅ DEBUG: Profile element created for:', employee.name);
  return memberDiv;
}

/**
 * 💬 Open Employee Chat (Multi-Chat Architecture)
 */
function openEmployeeChat(employeeId) {
  console.log('🔍 DEBUG: openEmployeeChat called with:', employeeId);
  console.log('🔍 DEBUG: Employee exists in EMPLOYEES:', !!EMPLOYEES[employeeId]);
  
  if (!EMPLOYEES[employeeId]) {
    console.error(`❌ Employee ${employeeId} not found`);
    console.error('❌ Available employees:', Object.keys(EMPLOYEES));
    return;
  }

  console.log('✅ DEBUG: Employee found:', EMPLOYEES[employeeId].name);
  
  // Hide welcome screen
  const welcomeScreen = document.getElementById('welcomeScreen');
  if (welcomeScreen) {
    welcomeScreen.style.display = 'none';
  }

  // Check if chat already exists
  const existingChat = document.getElementById(`chat-${employeeId}`);
  if (existingChat) {
    console.log(`📱 Chat with ${employeeId} already open, bringing to focus`);
    existingChat.scrollIntoView({ behavior: 'smooth' });
    return;
  }

  console.log('🔍 DEBUG: Creating new chat container for:', employeeId);
  // Create new chat container
  const chatContainer = createEmployeeChatContainer(employeeId);
  const multiChatInterface = document.getElementById('multiChatInterface');
  
  if (!multiChatInterface) {
    console.error('❌ multiChatInterface not found in DOM');
    return;
  }
  
  multiChatInterface.appendChild(chatContainer);

  // Add to active chats
  activeChats.add(employeeId);

  // Update employee profile as active
  updateEmployeeProfileStatus(employeeId, 'active');

  console.log(`✅ Chat opened with ${EMPLOYEES[employeeId].name}`);
}

/**
 * 🏗️ Create Employee Chat Container
 */
function createEmployeeChatContainer(employeeId) {
  const employee = EMPLOYEES[employeeId];
  const chatDiv = document.createElement('div');
  chatDiv.className = 'employee-chat-container';
  chatDiv.id = `chat-${employeeId}`;

  chatDiv.innerHTML = `
    <div class="employee-chat-header">
      <div class="employee-info">
        <img src="${employee.avatar}" alt="${employee.name}" class="employee-avatar-small">
        <div>
          <h4>${employee.name}</h4>
          <div class="employee-role">${employee.role}</div>
        </div>
      </div>
      <button class="close-chat-btn" onclick="closeEmployeeChat('${employeeId}')">✕</button>
    </div>

    <div class="employee-description">
      <p>${employee.description}</p>
    </div>

    <div class="quick-actions">
      ${employee.quickActions.map(action => `
        <div class="quick-action" onclick="sendQuickMessage('${employeeId}', '${action.message}')">
          <span>${action.icon}</span>
          <span>${action.text}</span>
        </div>
      `).join('')}
    </div>

    <div class="chat-messages" id="messages-${employeeId}">
      <div class="welcome-message">
        <div class="welcome-avatar">
          <span>🤖</span>
        </div>
        <div class="welcome-content">
          <h4>Hello! I'm ${employee.name}</h4>
          <p>${employee.description}</p>
          <p>How can I help you today?</p>
        </div>
      </div>
    </div>

    <div class="chat-input-container">
      <form class="chat-form" onsubmit="sendMessage(event, '${employeeId}')">
        <div class="input-wrapper">
          <textarea id="input-${employeeId}" placeholder="Type your message to ${employee.name}..." rows="1"></textarea>
          <button type="submit" class="send-button" id="send-${employeeId}">
            <span>📤</span>
          </button>
        </div>
        <div class="character-count" id="count-${employeeId}">0/4000</div>
      </form>
    </div>
  `;

  // Setup input auto-resize and character count
  setupChatInput(employeeId);

  return chatDiv;
}

/**
 * ❌ Close Employee Chat
 */
function closeEmployeeChat(employeeId) {
  const chatContainer = document.getElementById(`chat-${employeeId}`);
  if (chatContainer) {
    chatContainer.remove();
    activeChats.delete(employeeId);
    updateEmployeeProfileStatus(employeeId, 'inactive');
    
    // Show welcome screen if no active chats
    if (activeChats.size === 0) {
      const welcomeScreen = document.getElementById('welcomeScreen');
      if (welcomeScreen) {
        welcomeScreen.style.display = 'block';
      }
    }
    
    console.log(`❌ Closed chat with ${EMPLOYEES[employeeId].name}`);
  }
}

/**
 * 📝 Setup Chat Input (Auto-resize and Character Count)
 */
function setupChatInput(employeeId) {
  const input = document.getElementById(`input-${employeeId}`);
  const countElement = document.getElementById(`count-${employeeId}`);

  if (!input || !countElement) return;

  // Auto-resize textarea
  input.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    
    // Update character count
    const length = this.value.length;
    countElement.textContent = `${length}/4000`;
    
    if (length > 3800) {
      countElement.className = 'character-count error';
    } else if (length > 3500) {
      countElement.className = 'character-count warning';
    } else {
      countElement.className = 'character-count';
    }
  });

  // Setup Enter key handling
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const form = this.closest('.chat-form');
      if (form) {
        sendMessage(new Event('submit'), employeeId);
      }
    }
  });
}

/**
 * 📤 Send Message to Specific Employee
 */
async function sendMessage(event, employeeId) {
  event.preventDefault();
  
  if (!EMPLOYEES[employeeId]) {
    console.error(`❌ Employee ${employeeId} not found`);
    return;
  }

  const input = document.getElementById(`input-${employeeId}`);
  const sendButton = document.getElementById(`send-${employeeId}`);
  const messagesContainer = document.getElementById(`messages-${employeeId}`);

  if (!input || !sendButton || !messagesContainer) {
    console.error(`❌ Chat elements not found for ${employeeId}`);
    return;
  }

  const message = input.value.trim();
  if (!message) return;

  const employee = EMPLOYEES[employeeId];

  // Add user message to chat
  addMessageToChat(employeeId, message, 'user');

  // Clear input and disable send button
  input.value = '';
  input.style.height = 'auto';
  updateCharacterCount(employeeId);
  
  // Set loading state for this employee
  setEmployeeLoadingState(employeeId, true);

  try {
    console.log(`📤 Sending message to ${employee.name}: ${message.substring(0, 100)}...`);

    // Send to backend API
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        employee: employeeId,
        thread_id: employeeStates[employeeId].threadId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.details || data.error || `HTTP ${response.status}`);
    }

    // Update thread ID if new
    if (data.thread_id && !employeeStates[employeeId].threadId) {
      employeeStates[employeeId].threadId = data.thread_id;
      console.log(`🧵 Thread established for ${employee.name}: ${data.thread_id}`);
    }

    // Handle response based on status
    if (data.status === 'completed') {
      addMessageToChat(employeeId, data.message, 'assistant');
      console.log(`✅ ${employee.name} completed: ${data.message.substring(0, 100)}...`);
    } else if (data.status === 'requires_action') {
      addMessageToChat(employeeId, `🔧 ${employee.name} is processing tool calls...`, 'assistant', 'system');
      console.log(`🔧 ${employee.name} requires action: ${data.tool_calls.length} tool calls`);
    } else {
      addMessageToChat(employeeId, `${employee.name} is processing your request...`, 'assistant', 'system');
    }

  } catch (error) {
    console.error(`❌ Error with ${employee.name}:`, error);
    addMessageToChat(employeeId, `❌ Error: ${error.message}`, 'assistant', 'error');
  } finally {
    // Clear loading state for this employee
    setEmployeeLoadingState(employeeId, false);
  }
}

/**
 * 💬 Add Message to Specific Employee Chat
 */
function addMessageToChat(employeeId, content, role, type = 'normal') {
  const messagesContainer = document.getElementById(`messages-${employeeId}`);
  if (!messagesContainer) return;

  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role} ${type}`;
  
  const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  if (role === 'user') {
    messageDiv.innerHTML = `
      <div class="message-content">${escapeHtml(content)}</div>
      <div class="message-time">${timestamp}</div>
    `;
  } else {
    messageDiv.innerHTML = `
      <div class="message-content">${escapeHtml(content)}</div>
      <div class="message-time">${timestamp}</div>
    `;
  }

  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Update message count
  employeeStates[employeeId].messageCount++;
}

/**
 * ⚡ Send Quick Message
 */
function sendQuickMessage(employeeId, message) {
  const input = document.getElementById(`input-${employeeId}`);
  if (input) {
    input.value = message;
    sendMessage(new Event('submit'), employeeId);
  }
}

/**
 * 🔄 Set Employee Loading State
 */
function setEmployeeLoadingState(employeeId, isLoading) {
  employeeStates[employeeId].isLoading = isLoading;
  
  const sendButton = document.getElementById(`send-${employeeId}`);
  const input = document.getElementById(`input-${employeeId}`);
  const messagesContainer = document.getElementById(`messages-${employeeId}`);

  if (sendButton) {
    sendButton.disabled = isLoading;
    sendButton.innerHTML = isLoading ? '<div class="spinner">⏳</div>' : '<span>📤</span>';
  }

  if (input) {
    input.disabled = isLoading;
  }

  // Add/remove typing indicator
  if (messagesContainer) {
    const existingIndicator = messagesContainer.querySelector('.typing-indicator');
    
    if (isLoading && !existingIndicator) {
      const typingDiv = document.createElement('div');
      typingDiv.className = 'message assistant typing-indicator';
      typingDiv.innerHTML = `
        <div class="typing-indicator">
          <span></span>
          <span></span>
          <span></span>
        </div>
      `;
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else if (!isLoading && existingIndicator) {
      existingIndicator.remove();
    }
  }
}

/**
 * 🔢 Update Character Count
 */
function updateCharacterCount(employeeId) {
  const input = document.getElementById(`input-${employeeId}`);
  const countElement = document.getElementById(`count-${employeeId}`);
  
  if (input && countElement) {
    const length = input.value.length;
    countElement.textContent = `${length}/4000`;
  }
}

/**
 * 👤 Update Employee Profile Status
 */
function updateEmployeeProfileStatus(employeeId, status) {
  const profileElement = document.querySelector(`[data-employee-id="${employeeId}"]`);
  if (profileElement) {
    profileElement.classList.toggle('active', status === 'active');
  }
}

/**
 * 🚀 Start Chat With Employee (for quick start buttons)
 */
function startChatWith(employeeId) {
  openEmployeeChat(employeeId);
}

/**
 * 🔧 Setup Global Event Listeners
 */
function setupGlobalEventListeners() {
  // Handle window resize
  window.addEventListener('resize', function() {
    // Adjust chat layouts if needed
  });

  // Handle keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + 1-4 to quickly open employee chats
    if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const employeeIds = Object.keys(EMPLOYEES);
      const index = parseInt(e.key) - 1;
      if (employeeIds[index]) {
        openEmployeeChat(employeeIds[index]);
      }
    }
  });
}

/**
 * 🧹 Clear Specific Employee Chat
 */
function clearEmployeeChat(employeeId) {
  const messagesContainer = document.getElementById(`messages-${employeeId}`);
  if (messagesContainer) {
    messagesContainer.innerHTML = `
      <div class="welcome-message">
        <div class="welcome-avatar">
          <span>🤖</span>
        </div>
        <div class="welcome-content">
          <h4>Hello! I'm ${EMPLOYEES[employeeId].name}</h4>
          <p>${EMPLOYEES[employeeId].description}</p>
          <p>How can I help you today?</p>
        </div>
      </div>
    `;
    
    // Reset thread ID
    employeeStates[employeeId].threadId = null;
    employeeStates[employeeId].messageCount = 0;
    
    console.log(`🧹 Cleared chat for ${EMPLOYEES[employeeId].name}`);
  }
}

/**
 * 🛡️ Escape HTML for security
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 📊 Debug: Log System State
 */
function debugSystemState() {
  console.log('🔍 System State Debug:');
  console.log('Active Chats:', Array.from(activeChats));
  console.log('Employee States:', employeeStates);
  console.log('Configured Employees:', Object.keys(EMPLOYEES));
}

// Make debug function globally available
window.debugSystemState = debugSystemState;

console.log('✅ AI Employee Multi-Chat System Loaded!');