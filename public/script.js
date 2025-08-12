// Multi-Agent Chat System - Comprehensive Repair
console.log('🚀 Initializing Multi-Agent Chat System...');

// Global State Management
const appState = {
    activeEmployees: new Map(),
    employeeStates: new Map(),
    isInitialized: false,
    eventListeners: new Map()
};

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
        role: 'Lead Generation Plan Strategist',
        avatar: '/branding.png',
        description: 'Strategic planner for lead generation campaigns. I develop comprehensive strategies to maximize your outreach effectiveness.',
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

// Chat System Class
class MultiAgentChatSystem {
    constructor() {
        this.employees = EMPLOYEES;
        this.activeChats = new Map();
        this.loadingStates = new Map();
        this.messageCounters = new Map();
        
        console.log('💼 Chat system initialized with employees:', Object.keys(this.employees));
    }

    async initialize() {
        try {
            console.log('🔧 Initializing chat system components...');
            
            // Initialize employee states
            Object.keys(this.employees).forEach(employeeId => {
                this.loadingStates.set(employeeId, false);
                this.messageCounters.set(employeeId, 0);
                appState.employeeStates.set(employeeId, {
                    threadId: null,
                    messages: [],
                    isActive: false,
                    lastActivity: null
                });
            });

            // Setup UI components
            await this.setupSidebar();
            await this.setupChatInterface();
            
            // Initialize event listeners
            this.setupGlobalEventListeners();
            
            console.log('✅ Multi-agent chat system initialized successfully');
            appState.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Failed to initialize chat system:', error);
            this.handleSystemError(error);
        }
    }

    setupSidebar() {
        const teamMembers = document.querySelector('.team-members');
        if (!teamMembers) {
            console.error('❌ Team members container not found');
            return;
        }

        // Clear existing members
        teamMembers.innerHTML = '';

        // Add each employee to sidebar
        Object.values(this.employees).forEach(employee => {
            const memberElement = this.createEmployeeElement(employee);
            teamMembers.appendChild(memberElement);
        });

        console.log('✅ Sidebar setup complete');
    }

    createEmployeeElement(employee) {
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
            <div class="member-stats">
                <div class="notification-badge" id="notification-${employee.id}" style="display: none;">0</div>
            </div>
        `;

        // Add click listener for chat activation
        memberDiv.addEventListener('click', () => {
            this.activateEmployeeChat(employee.id);
        });

        return memberDiv;
    }

    async setupChatInterface() {
        const chatInterface = document.querySelector('.chat-interface');
        if (!chatInterface) {
            console.error('❌ Chat interface container not found');
            return;
        }

        // Create multi-chat container
        const multiChatContainer = document.createElement('div');
        multiChatContainer.id = 'multi-chat-container';
        multiChatContainer.className = 'multi-chat-container';
        multiChatContainer.innerHTML = `
            <div class="chat-welcome">
                <div class="welcome-content">
                    <h3>🤖 AI Employee Dashboard</h3>
                    <p>Select an AI employee from the sidebar to start chatting. You can have multiple conversations running simultaneously!</p>
                    <div class="active-chats-counter">
                        <span>Active Chats: <span id="active-chat-count">0</span></span>
                    </div>
                </div>
            </div>
        `;

        chatInterface.innerHTML = '';
        chatInterface.appendChild(multiChatContainer);

        console.log('✅ Chat interface setup complete');
    }

    async activateEmployeeChat(employeeId) {
        try {
            console.log(`🎯 Activating chat for ${employeeId}...`);
            
            if (!this.employees[employeeId]) {
                throw new Error(`Employee ${employeeId} not found in configuration`);
            }

            // Check if chat is already active
            if (this.activeChats.has(employeeId)) {
                console.log(`💬 Chat for ${employeeId} is already active`);
                this.scrollToChatContainer(employeeId);
                return;
            }

            const employee = this.employees[employeeId];
            const chatContainer = await this.createChatContainer(employee);
            
            // Add to active chats
            this.activeChats.set(employeeId, {
                container: chatContainer,
                employee: employee,
                createdAt: new Date()
            });

            // Insert chat container
            const multiChatContainer = document.getElementById('multi-chat-container');
            const welcomeDiv = multiChatContainer.querySelector('.chat-welcome');
            
            if (welcomeDiv) {
                multiChatContainer.insertBefore(chatContainer, welcomeDiv);
            } else {
                multiChatContainer.appendChild(chatContainer);
            }

            // Update active chat counter
            this.updateActiveChatCounter();

            // Initialize welcome message
            await this.sendWelcomeMessage(employeeId);

            // Setup chat-specific event listeners
            this.setupChatEventListeners(employeeId);

            // Update sidebar
            this.updateSidebarState(employeeId, true);

            console.log(`✅ Chat activated for ${employee.name}`);

        } catch (error) {
            console.error(`❌ Failed to activate chat for ${employeeId}:`, error);
            this.showErrorNotification(`Failed to start chat with ${employeeId}: ${error.message}`);
        }
    }

    async createChatContainer(employee) {
        const container = document.createElement('div');
        container.className = 'employee-chat-container';
        container.id = `chat-${employee.id}`;
        container.dataset.employee = employee.id;

        container.innerHTML = `
            <div class="employee-chat-header">
                <div class="employee-info">
                    <img src="${employee.avatar}" alt="${employee.name}" class="employee-avatar-small" />
                    <div>
                        <h4>${employee.name}</h4>
                        <span class="employee-role">${employee.role}</span>
                    </div>
                </div>
                <button class="close-chat-btn" data-employee="${employee.id}">×</button>
            </div>
            <div class="chat-messages" id="messages-${employee.id}">
                <!-- Messages will be added here -->
            </div>
            <div class="chat-input-container">
                <form class="chat-form" id="form-${employee.id}">
                    <div class="input-wrapper">
                        <textarea
                            id="input-${employee.id}"
                            placeholder="Ask ${employee.name} anything..."
                            rows="1"
                            maxlength="2000"
                        ></textarea>
                        <button type="submit" class="send-button" id="send-${employee.id}">
                            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="character-count">
                        <span id="char-count-${employee.id}">0</span>/2000
                    </div>
                </form>
            </div>
        `;

        return container;
    }

    setupChatEventListeners(employeeId) {
        const form = document.getElementById(`form-${employeeId}`);
        const input = document.getElementById(`input-${employeeId}`);
        const closeBtn = document.querySelector(`[data-employee="${employeeId}"]`);
        const charCount = document.getElementById(`char-count-${employeeId}`);

        if (!form || !input) {
            console.error(`❌ Form or input elements not found for ${employeeId}`);
            return;
        }

        // Remove existing listeners to prevent duplicates
        this.removeEventListeners(employeeId);

        // Form submission
        const formHandler = async (e) => {
            e.preventDefault();
            await this.handleMessageSubmission(employeeId);
        };

        // Input events
        const inputHandler = () => {
            this.handleInputChange(employeeId);
        };

        const keydownHandler = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                form.dispatchEvent(new Event('submit'));
            }
        };

        // Close button
        const closeHandler = () => {
            this.closeChatContainer(employeeId);
        };

        // Add event listeners
        form.addEventListener('submit', formHandler);
        input.addEventListener('input', inputHandler);
        input.addEventListener('keydown', keydownHandler);
        if (closeBtn) closeBtn.addEventListener('click', closeHandler);

        // Store listeners for cleanup
        appState.eventListeners.set(employeeId, {
            form: { element: form, event: 'submit', handler: formHandler },
            input: { element: input, event: 'input', handler: inputHandler },
            keydown: { element: input, event: 'keydown', handler: keydownHandler },
            close: closeBtn ? { element: closeBtn, event: 'click', handler: closeHandler } : null
        });

        console.log(`✅ Event listeners setup for ${employeeId}`);
    }

    removeEventListeners(employeeId) {
        const listeners = appState.eventListeners.get(employeeId);
        if (listeners) {
            Object.values(listeners).forEach(listener => {
                if (listener && listener.element) {
                    listener.element.removeEventListener(listener.event, listener.handler);
                }
            });
            appState.eventListeners.delete(employeeId);
        }
    }

    async handleMessageSubmission(employeeId) {
        try {
            const input = document.getElementById(`input-${employeeId}`);
            const message = input.value.trim();

            if (!message) return;

            console.log(`📤 Sending message to ${employeeId}: ${message.substring(0, 100)}...`);

            // Set loading state for this specific employee
            this.setLoadingState(employeeId, true);

            // Add user message to chat
            this.addMessage(employeeId, {
                type: 'user',
                content: message,
                timestamp: new Date()
            });

            // Clear input
            input.value = '';
            this.handleInputChange(employeeId);

            // Get current thread state
            const employeeState = appState.employeeStates.get(employeeId);

            // Send to API
            const response = await fetch('/api/ask', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    employee: employeeId,
                    thread_id: employeeState.threadId
                }),
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log(`📥 Response from ${employeeId}:`, data);

            // Update thread ID if new
            if (data.thread_id && data.thread_id !== employeeState.threadId) {
                employeeState.threadId = data.thread_id;
                appState.employeeStates.set(employeeId, employeeState);
            }

            // Add assistant response
            if (data.message) {
                this.addMessage(employeeId, {
                    type: 'assistant',
                    content: data.message,
                    timestamp: new Date()
                });
            }

            // Handle different response statuses
            if (data.status === 'requires_action') {
                this.addMessage(employeeId, {
                    type: 'system',
                    content: `${this.employees[employeeId].name} is processing your request with external tools...`,
                    timestamp: new Date()
                });
            }

        } catch (error) {
            console.error(`❌ Error sending message to ${employeeId}:`, error);
            this.addMessage(employeeId, {
                type: 'error',
                content: `Sorry, I encountered an error: ${error.message}`,
                timestamp: new Date()
            });
            this.showErrorNotification(`Failed to send message to ${employeeId}`);
        } finally {
            // Always clear loading state for this specific employee
            this.setLoadingState(employeeId, false);
        }
    }

    setLoadingState(employeeId, isLoading) {
        this.loadingStates.set(employeeId, isLoading);
        
        const sendButton = document.getElementById(`send-${employeeId}`);
        const messagesContainer = document.getElementById(`messages-${employeeId}`);
        
        if (sendButton) {
            sendButton.disabled = isLoading;
        }

        if (messagesContainer) {
            const existingTyping = messagesContainer.querySelector('.typing-indicator-message');
            
            if (isLoading && !existingTyping) {
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
                this.scrollToBottom(employeeId);
            } else if (!isLoading && existingTyping) {
                // Remove typing indicator
                existingTyping.remove();
            }
        }

        console.log(`🔄 Loading state for ${employeeId}: ${isLoading}`);
    }

    addMessage(employeeId, messageData) {
        const messagesContainer = document.getElementById(`messages-${employeeId}`);
        if (!messagesContainer) {
            console.error(`❌ Messages container not found for ${employeeId}`);
            return;
        }

        // Remove any existing typing indicators
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

        let messageContent = '';
        if (messageData.type === 'system') {
            messageContent = `
                <div class="message-content system">
                    <em>${messageData.content}</em>
                </div>
                <div class="message-time">${timeString}</div>
            `;
        } else {
            messageContent = `
                <div class="message-content">
                    ${this.formatMessageContent(messageData.content)}
                </div>
                <div class="message-time">${timeString}</div>
            `;
        }

        messageElement.innerHTML = messageContent;
        messagesContainer.appendChild(messageElement);

        // Update message counter and scroll
        const currentCount = this.messageCounters.get(employeeId) || 0;
        this.messageCounters.set(employeeId, currentCount + 1);
        
        this.scrollToBottom(employeeId);

        console.log(`💬 Message added to ${employeeId} chat`);
    }

    formatMessageContent(content) {
        // Basic markdown-like formatting
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    async sendWelcomeMessage(employeeId) {
        const employee = this.employees[employeeId];
        if (!employee) return;

        const welcomeMessage = {
            type: 'assistant',
            content: `Hello! I'm ${employee.name}, your ${employee.role}. ${employee.description}

How can I help you today?`,
            timestamp: new Date()
        };

        // Add welcome message after a short delay
        setTimeout(() => {
            this.addMessage(employeeId, welcomeMessage);
        }, 500);
    }

    handleInputChange(employeeId) {
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

    closeChatContainer(employeeId) {
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

    updateActiveChatCounter() {
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

    updateSidebarState(employeeId, isActive) {
        const memberElement = document.querySelector(`[data-employee="${employeeId}"]`);
        if (memberElement) {
            if (isActive) {
                memberElement.classList.add('active');
            } else {
                memberElement.classList.remove('active');
            }
        }
    }

    scrollToBottom(employeeId) {
        const messagesContainer = document.getElementById(`messages-${employeeId}`);
        if (messagesContainer) {
            setTimeout(() => {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 100);
        }
    }

    scrollToChatContainer(employeeId) {
        const chatContainer = document.getElementById(`chat-${employeeId}`);
        if (chatContainer) {
            chatContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    setupGlobalEventListeners() {
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

    handleNavigation(navItem) {
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

    switchToSection(sectionId) {
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

    handleWindowResize() {
        // Adjust chat containers on window resize
        this.activeChats.forEach((chatData, employeeId) => {
            this.scrollToBottom(employeeId);
        });
    }

    showErrorNotification(message) {
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

    handleSystemError(error) {
        console.error('🚨 SYSTEM ERROR:', error);
        this.showErrorNotification('System initialization failed. Please refresh the page.');
    }

    // Public API methods
    getSystemStatus() {
        return {
            initialized: appState.isInitialized,
            activeChats: this.activeChats.size,
            employees: Object.keys(this.employees),
            loadingStates: Object.fromEntries(this.loadingStates)
        };
    }

    getEmployeeState(employeeId) {
        return appState.employeeStates.get(employeeId);
    }

    getAllEmployeeStates() {
        return Object.fromEntries(appState.employeeStates);
    }
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