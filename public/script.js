// Multi-Agent Chat System - Comprehensive Repair
console.log('🚀 Initializing Multi-Agent Chat System...');

// Global State Management
let currentEmployee = 'brenden';
let employeeLoadingStates = new Map(); // Per-employee loading states
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
        role: 'Lead Generation Plan Strategist',
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

// Initialize all employee loading states
Object.keys(EMPLOYEES).forEach(employeeId => {
    employeeLoadingStates.set(employeeId, false);
});

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

function setupNavigation() {
    console.log('🧭 Setting up navigation...');
    
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get section from data attribute or text content
            let section = item.dataset.section;
            if (!section) {
                // Map text content to section IDs
                const text = item.textContent.trim().toLowerCase();
                const sectionMap = {
                    'dashboard': 'dashboard',
                    'leads': 'leads', 
                    'employees': 'employees',
                    'calls': 'calls',
                    'campaigns': 'campaigns',
                    'landing pages': 'landing-pages',
                    'branding': 'branding',
                    'status': 'status'
                };
                section = sectionMap[text] || text.replace(/\s+/g, '-');
            }
            
            console.log(`🔄 Navigating to section: ${section}`);
            
            // Update navigation active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Switch to section
            switchToSection(section);
        });
    });
    
    console.log('✅ Navigation setup complete');
}

function switchToSection(sectionId) {
    console.log(`📄 Switching to section: ${sectionId}`);
    
    // Hide all content sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        console.log(`✅ Section ${sectionId} is now active`);
        
        // Load section-specific data
        loadSectionData(sectionId);
    } else {
        console.error(`❌ Section ${sectionId} not found in DOM`);
    }
}

async function loadSectionData(sectionId) {
    console.log(`📊 Loading data for section: ${sectionId}`);
    
    switch (sectionId) {
        case 'dashboard':
            await loadDashboardData();
            break;
        case 'leads':
            await loadLeadsData();
            break;
        case 'status':
            await loadStatusData();
            break;
        case 'employees':
            // Already loaded, nothing additional needed
            break;
        default:
            console.log(`ℹ️ No specific data loading for section: ${sectionId}`);
    }
}

async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    // Dashboard loading logic would go here
}

async function loadLeadsData() {
    console.log('👥 Loading leads data...');
    // Leads loading logic would go here
}

async function loadStatusData() {
    console.log('🔧 Loading status data...');
    // Status loading logic would go here
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
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message || employeeLoadingStates.get(currentEmployee)) {
        return;
    }
    
    console.log(`📤 Sending message to ${currentEmployee}: ${message.substring(0, 100)}...`);
    
    try {
        // Set loading state for current employee
        setLoadingState(true);
        
        // Add user message to chat
        addMessage({
            type: 'user',
            content: message,
            timestamp: new Date()
        });

        // Clear input
        messageInput.value = '';
        updateCharacterCount();

        // Send message to API
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                employee: currentEmployee,
                thread_id: threadId
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        console.log(`📥 Response from ${currentEmployee}:`, data);

        // Update thread ID if provided
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

        // Handle different response statuses
        if (data.status === 'requires_action') {
            addMessage({
                type: 'system',
                content: `${EMPLOYEES[currentEmployee].name} is processing your request with external tools...`,
                timestamp: new Date()
            });
        }

    } catch (error) {
        console.error('❌ Error sending message:', error);
        addMessage({
            type: 'error',
            content: `Sorry, I encountered an error: ${error.message}`,
            timestamp: new Date()
        });
        showErrorNotification('Failed to send message');
    } finally {
        // Always clear loading state
        setLoadingState(false);
    }
}

function setLoadingState(loading) {
    // Set loading state for current employee only
    employeeLoadingStates.set(currentEmployee, loading);
    
    const sendButton = document.querySelector('.send-button');
    const messageInput = document.getElementById('messageInput');
    const messagesContainer = document.querySelector('.chat-messages');
    
    if (sendButton) {
        sendButton.disabled = loading || !messageInput?.value.trim();
    }

    if (messagesContainer) {
        // Remove any existing typing indicators
        const existingTyping = messagesContainer.querySelector('.typing-indicator-message');
        if (existingTyping) {
            existingTyping.remove();
        }
        
        if (loading) {
            // Add typing indicator for current employee
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
        }
    }
    
    console.log(`🔄 Loading state for ${currentEmployee}: ${loading}`);
}

function addMessage(messageData) {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) {
        console.error('❌ Messages container not found');
        return;
    }

    // CRITICAL: Always remove typing indicators when adding a real message
    const typingIndicator = messagesContainer.querySelector('.typing-indicator-message');
    if (typingIndicator) {
        typingIndicator.remove();
        console.log(`✅ Removed typing indicator for ${currentEmployee}`);
    }

    const messageElement = document.createElement('div');
    messageElement.className = `message ${messageData.type}`;
    
    const timeString = messageData.timestamp.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    let messageContentHtml = '';
    if (messageData.type === 'system') {
        messageContentHtml = `
            <div class="message-content system">
                <em>${messageData.content}</em>
            </div>
            <div class="message-time">${timeString}</div>
        `;
    } else {
        messageContentHtml = `
            <div class="message-content">
                ${formatMessageContent(messageData.content)}
            </div>
            <div class="message-time">${timeString}</div>
        `;
    }

    messageElement.innerHTML = messageContentHtml;
    messagesContainer.appendChild(messageElement);
    
    scrollToBottom();
    
    console.log(`💬 Message added to ${currentEmployee} chat`);
}

function formatMessageContent(content) {
    // Basic markdown-like formatting
    return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

function handleInputKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const form = document.getElementById('messageForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
}

function handleInputChange() {
    updateCharacterCount();
    updateSendButtonState();
}

function updateCharacterCount() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.querySelector('.character-count');
    
    if (messageInput && charCount) {
        const length = messageInput.value.length;
        const maxLength = 2000;
        
        charCount.textContent = length;
        
        if (length > maxLength * 0.9) {
            charCount.classList.add('warning');
        } else {
            charCount.classList.remove('warning');
        }
        
        if (length > maxLength) {
            charCount.classList.add('error');
        } else {
            charCount.classList.remove('error');
        }
    }
}

function updateSendButtonState() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.querySelector('.send-button');
    
    if (messageInput && sendButton) {
        const hasText = messageInput.value.trim().length > 0;
        const isCurrentEmployeeLoading = employeeLoadingStates.get(currentEmployee) || false;
        sendButton.disabled = !hasText || isCurrentEmployeeLoading;
    }
}

function scrollToBottom() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
}

function showErrorNotification(message) {
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

// Global utility functions that were missing
async function downloadLeads(format) {
    console.log(`📥 Downloading leads in ${format} format...`);
    
    try {
        const response = await fetch(`/api/leads/export?format=${format}`);
        
        if (!response.ok) {
            throw new Error(`Export failed: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leads_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showSuccessNotification(`Leads exported successfully as ${format.toUpperCase()}`);
    } catch (error) {
        console.error('❌ Export failed:', error);
        showErrorNotification('Failed to export leads');
    }
}

function showSuccessNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification notification-success';
    notification.innerHTML = `
        <div class="notification-content">
            <span>✅ ${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Mobile menu functionality
function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Initialize mobile menu if toggle exists
document.addEventListener('DOMContentLoaded', () => {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
});

console.log('🎯 Script.js loaded and ready');