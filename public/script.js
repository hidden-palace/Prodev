// Chat Interface Application
console.log('🚀 Chat Interface loaded');

// Global variables
let currentEmployee = 'brenden';
let currentConversation = [];
let isLoading = false;

// DOM Elements
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatForm = document.getElementById('chatForm');

// Employee profiles cache
let employeeProfiles = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async () => {
    console.log('✅ DOM loaded, initializing chat interface');
    
    // Load employee profiles for avatars
    await loadEmployeeProfiles();
    
    // Set up event listeners
    setupEventListeners();
    
    // Load initial welcome message
    displayWelcomeMessage();
    
    // Initialize other components
    initializeSidebar();
    initializeNavigation();
});

/**
 * Load employee profiles for avatar display
 */
async function loadEmployeeProfiles() {
    try {
        const response = await fetch('/api/branding/employee-profiles');
        if (response.ok) {
            const profiles = await response.json();
            // Convert array to object for easier lookup
            profiles.forEach(profile => {
                employeeProfiles[profile.employee_id] = profile;
            });
            console.log('✅ Employee profiles loaded:', Object.keys(employeeProfiles));
        }
    } catch (error) {
        console.error('❌ Failed to load employee profiles:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    if (chatForm) {
        chatForm.addEventListener('submit', handleSendMessage);
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', handleSendMessage);
    }
    
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
            }
        });
        
        messageInput.addEventListener('input', updateSendButton);
    }
}

/**
 * Handle sending messages
 */
async function handleSendMessage(e) {
    e.preventDefault();
    
    if (isLoading || !messageInput) return;
    
    const message = messageInput.value.trim();
    if (!message) return;
    
    try {
        isLoading = true;
        updateSendButton();
        
        // Display user message
        displayMessage('user', message, 'You');
        
        // Clear input
        messageInput.value = '';
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send to API
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                employee: currentEmployee
            })
        });
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        if (response.ok) {
            // Display AI response
            const employeeName = getEmployeeName(currentEmployee);
            displayMessage('assistant', data.message, employeeName);
            
            // Handle different response statuses
            if (data.status === 'requires_action') {
                displaySystemMessage('🔧 Processing tool calls in the background...');
            }
        } else {
            displayErrorMessage(data.error || 'An error occurred');
        }
        
    } catch (error) {
        console.error('❌ Error sending message:', error);
        hideTypingIndicator();
        displayErrorMessage('Failed to send message. Please try again.');
    } finally {
        isLoading = false;
        updateSendButton();
    }
}

/**
 * Display a message in the chat
 */
function displayMessage(sender, content, senderName, timestamp) {
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const now = timestamp || new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
    });
    
    // Create avatar
    const avatar = createAvatar(sender, senderName);
    
    messageDiv.innerHTML = `
        <div class="message-header">
            ${avatar}
            <div class="message-info">
                <span class="message-sender">${senderName}</span>
                <span class="message-time">${timeString}</span>
            </div>
        </div>
        <div class="message-content">
            ${formatMessageContent(content)}
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
    
    // Add fade-in animation
    requestAnimationFrame(() => {
        messageDiv.classList.add('message-animate');
    });
}

/**
 * Create avatar element
 */
function createAvatar(sender, senderName) {
    if (sender === 'user') {
        return `<div class="message-avatar user-avatar">You</div>`;
    }
    
    // For AI agents, try to load profile picture
    const employeeId = currentEmployee;
    const profile = employeeProfiles[employeeId];
    
    if (profile && profile.profile_picture_url) {
        return `
            <div class="message-avatar ai-avatar has-image">
                <img src="${profile.profile_picture_url}" alt="${senderName}" onerror="this.parentElement.innerHTML='${getEmployeeInitial(employeeId)}';">
            </div>
        `;
    } else {
        // Fallback to initial
        const initial = getEmployeeInitial(employeeId);
        return `<div class="message-avatar ai-avatar">${initial}</div>`;
    }
}

/**
 * Get employee initial
 */
function getEmployeeInitial(employeeId) {
    const initials = {
        'brenden': 'B',
        'rey': 'R', 
        'van': 'V'
    };
    return initials[employeeId] || 'AI';
}

/**
 * Get employee display name
 */
function getEmployeeName(employeeId) {
    const names = {
        'brenden': 'AI Brenden',
        'rey': 'AI Rey',
        'van': 'AI Van'
    };
    return names[employeeId] || 'AI Assistant';
}

/**
 * Format message content
 */
function formatMessageContent(content) {
    if (typeof content !== 'string') return content;
    
    // Convert line breaks to HTML
    content = content.replace(/\n/g, '<br>');
    
    // Format bold text
    content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Format italic text
    content = content.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Format code blocks
    content = content.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>');
    
    // Format inline code
    content = content.replace(/`(.*?)`/g, '<code>$1</code>');
    
    return content;
}

/**
 * Display welcome message
 */
function displayWelcomeMessage() {
    if (!chatMessages) return;
    
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = `
        <div class="welcome-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 5.5V6.5L11.5 7.5C11.1 7.6 10.6 7.5 10.3 7.1L8.8 5.4C8.4 5 7.8 4.9 7.3 5.1L4 6.9C3.4 7.2 3.2 7.9 3.5 8.5C3.8 9.1 4.5 9.3 5.1 9L7.2 8.2L8.7 9.9C9.1 10.3 9.6 10.5 10.2 10.4L12 10V11C12 11.6 12.4 12 13 12H15C15.6 12 16 11.6 16 11V9H21Z"/>
            </svg>
        </div>
        <div class="welcome-content">
            <h4>Welcome to ${getEmployeeName(currentEmployee)}</h4>
            <p>I'm here to help you with lead research, data analysis, and business insights. How can I assist you today?</p>
        </div>
    `;
    
    chatMessages.appendChild(welcomeDiv);
    scrollToBottom();
}

/**
 * Display system message
 */
function displaySystemMessage(message) {
    if (!chatMessages) return;
    
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.innerHTML = `
        <div class="system-content">
            <span>${message}</span>
        </div>
    `;
    
    chatMessages.appendChild(systemDiv);
    scrollToBottom();
}

/**
 * Display error message
 */
function displayErrorMessage(error) {
    if (!chatMessages) return;
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <div class="error-content">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z"/>
            </svg>
            <span>${error}</span>
        </div>
    `;
    
    chatMessages.appendChild(errorDiv);
    scrollToBottom();
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    if (!chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing-message';
    typingDiv.id = 'typingIndicator';
    
    const employeeName = getEmployeeName(currentEmployee);
    const avatar = createAvatar('assistant', employeeName);
    
    typingDiv.innerHTML = `
        <div class="message-header">
            ${avatar}
            <div class="message-info">
                <span class="message-sender">${employeeName}</span>
                <span class="message-time">now</span>
            </div>
        </div>
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    scrollToBottom();
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

/**
 * Update send button state
 */
function updateSendButton() {
    if (!sendButton || !messageInput) return;
    
    const hasText = messageInput.value.trim().length > 0;
    sendButton.disabled = isLoading || !hasText;
}

/**
 * Scroll to bottom of chat
 */
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

/**
 * Initialize sidebar navigation
 */
function initializeSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', handleNavigation);
    });
}

/**
 * Initialize page navigation
 */
function initializeNavigation() {
    // Handle team member selection
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('click', (e) => {
            const employeeId = member.dataset.employee;
            if (employeeId) {
                selectEmployee(employeeId);
            }
        });
    });
}

/**
 * Handle navigation between sections
 */
function handleNavigation(e) {
    e.preventDefault();
    
    const targetSection = e.currentTarget.dataset.section;
    if (!targetSection) return;
    
    // Update active nav item
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Show target section
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetElement = document.getElementById(targetSection);
    if (targetElement) {
        targetElement.classList.add('active');
    }
}

/**
 * Select employee for chat
 */
function selectEmployee(employeeId) {
    currentEmployee = employeeId;
    
    // Update active team member
    document.querySelectorAll('.team-member').forEach(member => {
        member.classList.remove('active');
    });
    
    const selectedMember = document.querySelector(`[data-employee="${employeeId}"]`);
    if (selectedMember) {
        selectedMember.classList.add('active');
    }
    
    // Clear current chat and show welcome message
    if (chatMessages) {
        chatMessages.innerHTML = '';
        displayWelcomeMessage();
    }
    
    // Update chat header
    updateChatHeader();
    
    console.log(`✅ Switched to employee: ${getEmployeeName(employeeId)}`);
}

/**
 * Update chat header with current employee info
 */
function updateChatHeader() {
    const chatHeader = document.querySelector('.chat-header .employee-info');
    if (!chatHeader) return;
    
    const employeeName = getEmployeeName(currentEmployee);
    const avatar = createAvatar('assistant', employeeName);
    
    chatHeader.innerHTML = `
        ${avatar}
        <div class="employee-details">
            <h3>${employeeName}</h3>
            <div class="employee-role-tags">
                <span class="role-tag">Lead Research Specialist</span>
            </div>
            <div class="employee-badges">
                <span class="badge active">Active</span>
                <span class="badge performance">High Performance</span>
            </div>
        </div>
    `;
}

// Export functions for global access if needed
window.chatInterface = {
    selectEmployee,
    displayMessage,
    displaySystemMessage,
    displayErrorMessage,
    loadEmployeeProfiles
};

console.log('✅ Chat Interface script loaded successfully');