/**
 * Enhanced Chat Interface with Parallel Employee Conversations
 * Supports independent processing states for each AI employee
 */

// Global state management
let currentEmployee = 'brenden'; // Default employee
let isProcessing = {}; // Per-employee processing states
let employees = ['brenden', 'van', 'rey', 'xavier']; // Available employees

// Initialize processing states for all employees
function initializeProcessingStates() {
    employees.forEach(employeeId => {
        isProcessing[employeeId] = false;
    });
    console.log('🔧 Initialized processing states:', isProcessing);
}

// Update chat UI state based on current employee's processing status
function updateChatUIState() {
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.querySelector('.send-button');
    const isCurrentlyProcessing = isProcessing[currentEmployee] || false;
    
    if (messageInput) {
        messageInput.disabled = isCurrentlyProcessing;
        messageInput.placeholder = isCurrentlyProcessing 
            ? `${getEmployeeName(currentEmployee)} is thinking...` 
            : `Message ${getEmployeeName(currentEmployee)}...`;
    }
    
    if (sendButton) {
        sendButton.disabled = isCurrentlyProcessing;
        sendButton.innerHTML = isCurrentlyProcessing 
            ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/></svg>' 
            : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>';
    }
    
    console.log(`🎯 UI updated for ${currentEmployee}: processing=${isCurrentlyProcessing}`);
}

// Get employee display name
function getEmployeeName(employeeId) {
    const names = {
        'brenden': 'AI Brenden',
        'van': 'AI Van', 
        'rey': 'AI Rey',
        'xavier': 'AI Xavier'
    };
    return names[employeeId] || employeeId;
}

// Switch to a different employee
function switchEmployee(employeeId) {
    console.log(`🔄 Switching from ${currentEmployee} to ${employeeId}`);
    
    // Validate employee ID
    if (!employees.includes(employeeId)) {
        console.error(`❌ Invalid employee ID: ${employeeId}`);
        return;
    }
    
    // Initialize processing state for new employee if needed
    if (!(employeeId in isProcessing)) {
        isProcessing[employeeId] = false;
        console.log(`🆕 Initialized processing state for ${employeeId}`);
    }
    
    // Update current employee
    currentEmployee = employeeId;
    
    // Update UI to reflect new employee's state
    updateChatUIState();
    
    // Update active employee in UI
    updateActiveEmployeeUI(employeeId);
    
    // Load conversation for this employee
    loadEmployeeConversation(employeeId);
    
    console.log(`✅ Switched to ${getEmployeeName(employeeId)}`);
}

// Update active employee visual indicators
function updateActiveEmployeeUI(employeeId) {
    // Remove active class from all employee elements
    document.querySelectorAll('.team-member').forEach(member => {
        member.classList.remove('active');
    });
    
    // Add active class to selected employee
    const activeEmployee = document.querySelector(`[data-employee="${employeeId}"]`);
    if (activeEmployee) {
        activeEmployee.classList.add('active');
    }
    
    // Update chat header if it exists
    const chatHeader = document.querySelector('.employee-info h3');
    if (chatHeader) {
        chatHeader.textContent = getEmployeeName(employeeId);
    }
}

// Load conversation history for employee
function loadEmployeeConversation(employeeId) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    // For now, clear messages when switching (you can enhance this to persist conversations)
    chatMessages.innerHTML = `
        <div class="welcome-message">
            <div class="welcome-avatar">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                </svg>
            </div>
            <div class="welcome-content">
                <h4>Welcome to ${getEmployeeName(employeeId)}</h4>
                <p>I'm ready to help you with your requests. What can I do for you today?</p>
            </div>
        </div>
    `;
}

// Handle chat form submission
async function handleChatSubmit(event) {
    if (event) {
        event.preventDefault();
    }
    
    console.log(`🚀 handleChatSubmit called for ${currentEmployee}`);
    
    // Validate current employee
    if (!currentEmployee || !employees.includes(currentEmployee)) {
        console.error('❌ Invalid currentEmployee:', currentEmployee);
        showNotification('Please select a valid employee first', 'error');
        return;
    }
    
    // Check if current employee is already processing
    if (isProcessing[currentEmployee]) {
        console.log(`⏳ ${getEmployeeName(currentEmployee)} is already processing a message`);
        showNotification(`${getEmployeeName(currentEmployee)} is already processing a message`, 'warning');
        return;
    }
    
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) {
        console.error('❌ Message input not found');
        return;
    }
    
    const message = messageInput.value.trim();
    if (!message) {
        console.log('⚠️ Empty message, ignoring');
        return;
    }
    
    console.log(`📝 Sending message to ${getEmployeeName(currentEmployee)}: "${message.substring(0, 50)}..."`);
    
    try {
        // Set processing state for current employee
        isProcessing[currentEmployee] = true;
        updateChatUIState();
        
        // Add user message to chat
        addMessageToChat('user', message);
        
        // Clear input
        messageInput.value = '';
        
        // Add typing indicator
        addTypingIndicator();
        
        // Send message to API
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: message,
                employee: currentEmployee
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.details || errorData.error || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Add assistant response
        if (data.message) {
            addMessageToChat('assistant', data.message);
        }
        
        // Handle different response statuses
        if (data.status === 'requires_action') {
            showNotification(`${getEmployeeName(currentEmployee)} is processing tool calls...`, 'info');
        } else if (data.status === 'completed') {
            console.log(`✅ Message processed successfully by ${getEmployeeName(currentEmployee)}`);
        }
        
    } catch (error) {
        console.error(`❌ Error sending message to ${getEmployeeName(currentEmployee)}:`, error);
        
        // Remove typing indicator
        removeTypingIndicator();
        
        // Show error message
        addMessageToChat('assistant', `Sorry, I encountered an error: ${error.message}`);
        showNotification(`Error communicating with ${getEmployeeName(currentEmployee)}`, 'error');
        
    } finally {
        // Always reset processing state for current employee
        isProcessing[currentEmployee] = false;
        updateChatUIState();
        
        console.log(`🏁 Processing complete for ${getEmployeeName(currentEmployee)}`);
    }
}

// Add message to chat interface
function addMessageToChat(role, content) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = content;
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString();
    
    messageDiv.appendChild(messageContent);
    messageDiv.appendChild(messageTime);
    
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Add typing indicator
function addTypingIndicator() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing-indicator-message';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Remove typing indicator
function removeTypingIndicator() {
    const typingIndicator = document.querySelector('.typing-indicator-message');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Show notification
function showNotification(message, type = 'info') {
    console.log(`📢 Notification (${type}): ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-message">${message}</div>
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

// Handle Enter key in message input
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        handleChatSubmit();
    }
}

// Initialize the application
function initializeApp() {
    console.log('🚀 Initializing chat application...');
    
    // Initialize processing states
    initializeProcessingStates();
    
    // Set up event listeners
    const chatForm = document.getElementById('chatForm');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }
    
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keypress', handleKeyPress);
    }
    
    // Set up employee switching
    document.querySelectorAll('.team-member').forEach(member => {
        member.addEventListener('click', () => {
            const employeeId = member.dataset.employee;
            if (employeeId) {
                switchEmployee(employeeId);
            }
        });
    });
    
    // Initialize UI state
    updateChatUIState();
    updateActiveEmployeeUI(currentEmployee);
    loadEmployeeConversation(currentEmployee);
    
    console.log('✅ Chat application initialized successfully');
    console.log(`🎯 Current employee: ${getEmployeeName(currentEmployee)}`);
    console.log('🔧 Processing states:', isProcessing);
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}

// Export functions for global access (if needed)
window.switchEmployee = switchEmployee;
window.handleChatSubmit = handleChatSubmit;
window.showNotification = showNotification;