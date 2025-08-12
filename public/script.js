// Multi-Agent Chat System - Comprehensive Repair
console.log('🚀 Initializing Multi-Agent Chat System...');

// Global State Management
let currentEmployee = 'brenden';
let isLoading = false;
let messages = [];
let threadId = null;

// Employee Configuration - Aligned with Backend
const EMPLOYEES = {
    'brenden': {
        id: 'brenden',
        name: 'AI Brenden',
        role: 'Lead Research Specialist',
        avatar: '/branding.png',
        description: 'Expert in lead generation and business research. I help identify and qualify potential customers for your business.',
        color: '#3b82f6'
    },
    'van': {
        id: 'van', 
        name: 'AI Van',
        role: 'Digital Marketing Designer',
        avatar: '/branding.png',
        description: 'Specialized in creating compelling landing pages and marketing materials that convert visitors into customers.',
        color: '#10b981'
    },
    'Rey': {
        id: 'Rey',
        name: 'AI Rey',
        role: 'Voice Outreach Manager',
        avatar: '/branding.png',
        description: 'Voice outreach specialist. I help create and manage voice-based customer outreach campaigns.',
        color: '#f59e0b'
    },
    'Xavier': {
        id: 'Xavier',
        name: 'AI Xavier',
        role: 'UGC Expert',
        avatar: '/branding.png',
        description: 'User-generated content specialist. I help create authentic, engaging content that resonates with your target audience.',
        color: '#8b5cf6'
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Orchid Republic Multi-Agent Chat System - Initializing...');
    initializeApp();
});

async function initializeApp() {
    try {
        // Setup sidebar employees
        setupEmployeeSidebar();
        
        // Setup navigation
        setupNavigation();
        
        // Setup chat interface
        setupChatInterface();
        
        // Load default employee (Brenden)
        switchEmployee('brenden');
        
        console.log('✅ Application initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize application:', error);
    }
}

function setupEmployeeSidebar() {
    const teamMembers = document.querySelector('.team-members');
    if (!teamMembers) {
        console.error('❌ Team members container not found');
        return;
    }

    // Clear existing members
    teamMembers.innerHTML = '';

    // Add each employee to sidebar
    Object.values(EMPLOYEES).forEach(employee => {
        const memberElement = createEmployeeElement(employee);
        teamMembers.appendChild(memberElement);
    });

    console.log('✅ Employee sidebar setup complete with all 4 agents');
}

function createEmployeeElement(employee) {
    const memberDiv = document.createElement('div');
    memberDiv.className = 'team-member';
    memberDiv.dataset.employee = employee.id;
    
    memberDiv.innerHTML = `
        <div class="member-avatar">
            <img src="${employee.avatar}" alt="${employee.name}" />
            <div class="status-indicator online"></div>
        </div>
        <div class="member-info">
            <div class="member-name">${employee.name}</div>
            <div class="member-role">${employee.role}</div>
            <div class="member-tags">
                <span class="tag specialist">AI Agent</span>
            </div>
        </div>
    `;

    // Add click listener for employee switching
    memberDiv.addEventListener('click', () => {
        console.log(`🎯 Switching to employee: ${employee.id}`);
        switchEmployee(employee.id);
    });

    return memberDiv;
}

function setupChatInterface() {
    const messageForm = document.getElementById('messageForm');
    const messageInput = document.getElementById('messageInput');
    
    if (messageForm && messageInput) {
        messageForm.addEventListener('submit', handleMessageSubmit);
        messageInput.addEventListener('keydown', handleInputKeydown);
        messageInput.addEventListener('input', handleInputChange);
        console.log('✅ Chat interface event listeners attached');
    } else {
        console.error('❌ Chat form or input not found');
    }
}

function switchEmployee(employeeId) {
    console.log(`🔄 Switching to employee: ${employeeId}`);
    
    if (!EMPLOYEES[employeeId]) {
        console.error(`❌ Employee ${employeeId} not found`);
        return;
    }
    
    currentEmployee = employeeId;
    const employee = EMPLOYEES[employeeId];
    
    // Update chat header
    updateChatHeader(employee);
    
    // Update sidebar active state
    updateSidebarActiveState(employeeId);
    
    // Load employee's message history (if any)
    loadEmployeeMessages(employeeId);
    
    console.log(`✅ Switched to ${employee.name}`);
}

function updateChatHeader(employee) {
    // Update the chat header with employee information
    const employeeNameEl = document.querySelector('.employee-details h3');
    const employeeRoleEl = document.querySelector('.role-tag');
    const employeeAvatarEl = document.querySelector('.employee-avatar img');
    const employeeDescEl = document.querySelector('.employee-description p');
    
    if (employeeNameEl) employeeNameEl.textContent = employee.name;
    if (employeeRoleEl) employeeRoleEl.textContent = employee.role;
    if (employeeAvatarEl) {
        employeeAvatarEl.src = employee.avatar;
        employeeAvatarEl.alt = employee.name;
    }
    if (employeeDescEl) employeeDescEl.textContent = employee.description;
    
    console.log(`🏷️ Updated chat header for ${employee.name}`);
}

function updateSidebarActiveState(employeeId) {
    // Remove active state from all employees
    document.querySelectorAll('.team-member').forEach(member => {
        member.classList.remove('active');
    });
    
    // Add active state to selected employee
    const selectedMember = document.querySelector(`[data-employee="${employeeId}"]`);
    if (selectedMember) {
        selectedMember.classList.add('active');
    }
    
    console.log(`🎯 Updated sidebar active state for ${employeeId}`);
}

function loadEmployeeMessages(employeeId) {
    // For now, clear messages when switching employees
    // In a full implementation, you'd maintain separate message histories
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        messagesContainer.innerHTML = '';
        
        // Add welcome message for the selected employee
        const employee = EMPLOYEES[employeeId];
        addMessage({
            type: 'assistant',
            content: `Hello! I'm ${employee.name}, your ${employee.role}. ${employee.description}\n\nHow can I help you today?`,
            timestamp: new Date()
        });
    }
}

async function handleMessageSubmit(e) {
    e.preventDefault();
    
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message || isLoading) return;
    
    console.log(`📤 Sending message to ${currentEmployee}: ${message}`);
    
    try {
        // Add user message
        addMessage({
            type: 'user',
            content: message,
            timestamp: new Date()
        });
        
        // Clear input and set loading state
        input.value = '';
        setLoadingState(true);
        
        // Send to API
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                employee: currentEmployee,
                thread_id: threadId
            }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log(`📥 Response from ${currentEmployee}:`, data);
        
        // Update thread ID if new
        if (data.thread_id) {
            threadId = data.thread_id;
        }
        
        // Add assistant response
        if (data.message) {
            addMessage({
                type: 'assistant',
                content: data.message,
                timestamp: new Date()
            });
        }
        
        // Handle tool calls
        if (data.status === 'requires_action') {
            addMessage({
                type: 'system',
                content: `${EMPLOYEES[currentEmployee].name} is processing your request with external tools...`,
                timestamp: new Date()
            });
        }
        
    } catch (error) {
        console.error(`❌ Error sending message to ${currentEmployee}:`, error);
        addMessage({
            type: 'error',
            content: `Sorry, I encountered an error: ${error.message}`,
            timestamp: new Date()
        });
    } finally {
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    isLoading = loading;
    const sendButton = document.querySelector('.send-button');
    const messagesContainer = document.querySelector('.chat-messages');
    
    if (sendButton) {
        sendButton.disabled = loading;
    }
    
    if (messagesContainer) {
        const existingTyping = messagesContainer.querySelector('.typing-indicator-message');
        
        if (loading && !existingTyping) {
            // Add typing indicator
            const typingMessage = document.createElement('div');
            typingMessage.className = 'message assistant typing-indicator-message';
            typingMessage.innerHTML = `
                <div class="message-content">
                    <div class="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            `;
            messagesContainer.appendChild(typingMessage);
            scrollToBottom();
        } else if (!loading && existingTyping) {
            // Remove typing indicator - THIS FIXES REY'S PERSISTENT BUBBLE
            existingTyping.remove();
        }
    }
    
    console.log(`🔄 Loading state: ${loading} for ${currentEmployee}`);
}

function addMessage(messageData) {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) {
        console.error('❌ Messages container not found');
        return;
    }
    
    // Remove any existing typing indicators BEFORE adding new message
    const typingIndicator = messagesContainer.querySelector('.typing-indicator-message');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${messageData.type}`;
    
    const timeString = messageData.timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    const content = formatMessageContent(messageData.content);
    
    if (messageData.type === 'user') {
        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${timeString}</div>
        `;
        messageElement.style.alignSelf = 'flex-end';
        messageElement.style.backgroundColor = 'var(--primary-color)';
        messageElement.style.color = 'white';
        messageElement.style.borderRadius = '18px 18px 4px 18px';
        messageElement.style.maxWidth = '80%';
        messageElement.style.padding = '12px 16px';
    } else {
        messageElement.innerHTML = `
            <div class="message-content">${content}</div>
            <div class="message-time">${timeString}</div>
        `;
    }
    
    messagesContainer.appendChild(messageElement);
    messages.push(messageData);
    
    scrollToBottom();
    console.log(`💬 Message added to ${currentEmployee} chat`);
}

function formatMessageContent(content) {
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
}

function handleInputChange(employeeId) {
    const input = document.getElementById(`input-${employeeId}`);
    const charCount = document.getElementById(`char-count-${employeeId}`);
    const sendButton = document.getElementById(`send-${employeeId}`);

    if (!input) return;

    const length = input.value.length;
    const maxLength = parseInt(input.getAttribute('maxlength')) || 2000;

    if (charCount) {
        charCount.textContent = length;
        charCount.className = length > maxLength * 0.9 ? 'character-count warning' : 'character-count';
    }

    if (sendButton) {
        const isLoading = this.loadingStates.get(employeeId) || false;
        sendButton.disabled = isLoading || length === 0 || length > maxLength;
    }

    // Auto-resize textarea
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

function closeChatContainer(employeeId) {
    try {
        console.log(`🗑️ Closing chat for ${employeeId}...`);

        const chatContainer = document.getElementById(`chat-${employeeId}`);
        if (chatContainer) {
            chatContainer.remove();
        }

        // Remove from active chats
        this.activeChats.delete(employeeId);

        // Remove event listeners
        this.removeEventListeners(employeeId);

        // Update sidebar state
        this.updateSidebarState(employeeId, false);

        // Update counter
        this.updateActiveChatCounter();

        // Clear employee state
        const employeeState = appState.employeeStates.get(employeeId);
        if (employeeState) {
            employeeState.isActive = false;
            appState.employeeStates.set(employeeId, employeeState);
        }

        console.log(`✅ Chat closed for ${employeeId}`);

    } catch (error) {
        console.error(`❌ Error closing chat for ${employeeId}:`, error);
    }
}

function updateActiveChatCounter() {
    const counter = document.getElementById('active-chat-count');
    if (counter) {
        counter.textContent = this.activeChats.size;
    }

    // Show/hide welcome message based on active chats
    const welcomeDiv = document.querySelector('.chat-welcome');
    if (welcomeDiv) {
        welcomeDiv.style.display = this.activeChats.size === 0 ? 'block' : 'none';
    }
}

function updateSidebarState(employeeId, isActive) {
    const memberElement = document.querySelector(`[data-employee="${employeeId}"]`);
    if (memberElement) {
        if (isActive) {
            memberElement.classList.add('active');
        } else {
            memberElement.classList.remove('active');
        }
    }
}

function scrollToBottom(employeeId) {
    const messagesContainer = document.getElementById(`messages-${employeeId}`);
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
}

function scrollToChatContainer(employeeId) {
    const chatContainer = document.getElementById(`chat-${employeeId}`);
    if (chatContainer) {
        chatContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function setupGlobalEventListeners() {
    // Handle navigation between sections
    document.addEventListener('click', (e) => {
        if (e.target.matches('.nav-item')) {
            this.handleNavigation(e.target);
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        this.handleWindowResize();
    });

    console.log('✅ Global event listeners setup');
}

function handleNavigation(navItem) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // Add active class to clicked item
    navItem.classList.add('active');

    // Handle section switching
    const section = navItem.dataset.section;
    if (section) {
        this.switchToSection(section);
    }
}

function switchToSection(sectionId) {
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    console.log(`📄 Switched to section: ${sectionId}`);
}

function handleWindowResize() {
    // Adjust chat containers on window resize
    this.activeChats.forEach((chatData, employeeId) => {
        this.scrollToBottom(employeeId);
    });
}

function showErrorNotification(message) {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = 'notification notification-error';
    notification.innerHTML = `
        <div class="notification-content">
            <span>❌ ${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function handleSystemError(error) {
    console.error('🚨 SYSTEM ERROR:', error);
    this.showErrorNotification('System initialization failed. Please refresh the page.');
}

// Public API methods
function getSystemStatus() {
    return {
        initialized: appState.isInitialized,
        activeChats: this.activeChats.size,
        employees: Object.keys(this.employees),
        loadingStates: Object.fromEntries(this.loadingStates)
    };
}

function getEmployeeState(employeeId) {
    return appState.employeeStates.get(employeeId);
}

function getAllEmployeeStates() {
    return Object.fromEntries(appState.employeeStates);
}

// Navigation and General App Logic
class AppManager {
    constructor() {
        this.currentSection = 'employees';
        this.chatSystem = new MultiAgentChatSystem();
    }

    async initialize() {
        console.log('🚀 Initializing Orchid Republic application...');

        try {
            // Setup navigation
            this.setupNavigation();
            
            // Initialize chat system
            await this.chatSystem.initialize();

            // Load other components
            await this.loadDashboardData();
            await this.loadLeadsData();

            console.log('✅ Application initialized successfully');

        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this.handleInitializationError(error);
        }
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.textContent.trim().toLowerCase().replace(/\s+/g, '');
                
                // Map nav items to section IDs
                const sectionMap = {
                    'dashboard': 'dashboard',
                    'leads': 'leads',
                    'employees': 'employees',
                    'calls': 'calls',
                    'campaigns': 'campaigns',
                    'landingpages': 'landing-pages',
                    'branding': 'branding',
                    'status': 'status'
                };

                const targetSection = sectionMap[section];
                if (targetSection) {
                    this.switchSection(targetSection);
                    
                    // Update nav state
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');
                }
            });
        });

        console.log('✅ Navigation setup complete');
    }

    switchSection(sectionId) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
            
            // Load section-specific data
            this.loadSectionData(sectionId);
        }
    }

    async loadSectionData(sectionId) {
        switch (sectionId) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'leads':
                await this.loadLeadsData();
                break;
            case 'status':
                await this.loadStatusData();
                break;
        }
    }

    async loadDashboardData() {
        // Dashboard loading logic would go here
        console.log('📊 Loading dashboard data...');
    }

    async loadLeadsData() {
        // Leads loading logic would go here
        console.log('👥 Loading leads data...');
    }

    async loadStatusData() {
        // Status loading logic would go here
        console.log('🔧 Loading status data...');
    }

    handleInitializationError(error) {
        const errorContainer = document.createElement('div');
        errorContainer.className = 'initialization-error';
        errorContainer.innerHTML = `
            <div class="error-content">
                <h3>⚠️ Application Failed to Load</h3>
                <p>There was an error initializing the application: ${error.message}</p>
                <button onclick="window.location.reload()" class="btn primary">Reload Page</button>
            </div>
        `;
        
        document.body.appendChild(errorContainer);
    }
}

// Initialize Application
let appManager;

document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log('🎯 DOM loaded, initializing application...');
        
        appManager = new AppManager();
        await appManager.initialize();
        
        // Make chat system globally available for debugging
        window.chatSystem = appManager.chatSystem;
        window.appManager = appManager;
        
        console.log('🎉 Orchid Republic Multi-Agent Chat System Ready!');
        
    } catch (error) {
        console.error('🚨 Critical initialization error:', error);
    }
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MultiAgentChatSystem, AppManager };
}