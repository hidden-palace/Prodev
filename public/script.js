/**
 * Main Application Script
 * Handles UI interactions, API calls, and application state
 */

// Global state
let currentEmployee = 'brenden';
let currentThread = null;
let currentRun = null;
let isProcessing = false;
let brandingData = null;
let employeeProfiles = [];

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Application initializing...');
    
    // Initialize UI components
    initializeNavigation();
    initializeBranding();
    initializeEmployees();
    initializeDashboard();
    
    // Load initial data
    loadBrandingData();
    loadEmployeeProfiles();
    loadDashboardData();
    
    // Set default employee
    selectEmployee('brenden');
    
    console.log('✅ Application initialized successfully');
});

/**
 * Initialize navigation system
 */
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            contentSections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
            
            // Load section-specific data
            loadSectionData(targetSection);
        });
    });
}

/**
 * Initialize branding functionality
 */
function initializeBranding() {
    // Logo upload
    const logoInput = document.getElementById('logo-upload');
    if (logoInput) {
        logoInput.addEventListener('change', handleLogoUpload);
    }
    
    // Color inputs
    const colorInputs = document.querySelectorAll('input[type="color"]');
    colorInputs.forEach(input => {
        input.addEventListener('change', handleColorChange);
    });
    
    // Employee avatar uploads
    const avatarInputs = document.querySelectorAll('.avatar-upload');
    avatarInputs.forEach(input => {
        input.addEventListener('change', handleAvatarUpload);
    });
}

/**
 * Initialize employee chat interface
 */
function initializeEmployees() {
    // Team member selection
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.addEventListener('click', function() {
            const employeeId = this.dataset.employee;
            selectEmployee(employeeId);
        });
    });
    
    // Chat form
    const chatForm = document.getElementById('chat-form');
    if (chatForm) {
        chatForm.addEventListener('submit', handleChatSubmit);
    }
    
    // Message input
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleChatSubmit(e);
            }
        });
        
        messageInput.addEventListener('input', updateCharacterCount);
    }
    
    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

/**
 * Initialize dashboard
 */
function initializeDashboard() {
    // Refresh button
    const refreshBtn = document.getElementById('refresh-dashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDashboardData);
    }
    
    // Export buttons
    const exportBtns = document.querySelectorAll('.export-btn');
    exportBtns.forEach(btn => {
        btn.addEventListener('click', handleExport);
    });
}

/**
 * Load section-specific data
 */
function loadSectionData(section) {
    switch (section) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'leads':
            loadLeadsData();
            break;
        case 'employees':
            loadEmployeeData();
            break;
        case 'branding':
            loadBrandingData();
            break;
        case 'status':
            loadStatusData();
            break;
    }
}

/**
 * Load branding data
 */
async function loadBrandingData() {
    try {
        const response = await fetch('/api/branding');
        brandingData = await response.json();
        
        // Apply branding to UI
        applyBranding(brandingData);
        
        console.log('✅ Branding data loaded');
    } catch (error) {
        console.error('❌ Failed to load branding data:', error);
        showNotification('Failed to load branding data', 'error');
    }
}

/**
 * Apply branding to UI
 */
function applyBranding(branding) {
    // Update logo
    const logoElements = document.querySelectorAll('.sidebar-logo, .company-logo img');
    logoElements.forEach(logo => {
        if (branding.logo_url) {
            logo.src = branding.logo_url;
            logo.style.display = 'block';
            
            // Hide no-logo message
            const noLogoMessage = document.getElementById('no-logo-message');
            if (noLogoMessage) {
                noLogoMessage.style.display = 'none';
            }
        }
    });
    
    // Update colors
    const root = document.documentElement;
    if (branding.primary_color) {
        root.style.setProperty('--primary-color', branding.primary_color);
        const primaryInput = document.getElementById('primary-color');
        if (primaryInput) {
            primaryInput.value = branding.primary_color;
            primaryInput.nextElementSibling.value = branding.primary_color;
        }
    }
    if (branding.secondary_color) {
        root.style.setProperty('--secondary-color', branding.secondary_color);
        const secondaryInput = document.getElementById('secondary-color');
        if (secondaryInput) {
            secondaryInput.value = branding.secondary_color;
            secondaryInput.nextElementSibling.value = branding.secondary_color;
        }
    }
    if (branding.accent_color) {
        root.style.setProperty('--accent-color', branding.accent_color);
        const accentInput = document.getElementById('accent-color');
        if (accentInput) {
            accentInput.value = branding.accent_color;
            accentInput.nextElementSibling.value = branding.accent_color;
        }
    }
}

/**
 * Load employee profiles
 */
async function loadEmployeeProfiles() {
    try {
        const response = await fetch('/api/branding/employee-profiles');
        employeeProfiles = await response.json();
        
        // Update employee avatars
        updateEmployeeAvatars();
        
        console.log('✅ Employee profiles loaded');
    } catch (error) {
        console.error('❌ Failed to load employee profiles:', error);
    }
}

/**
 * Update employee avatars in UI
 */
function updateEmployeeAvatars() {
    employeeProfiles.forEach(profile => {
        const avatarElements = document.querySelectorAll(`[data-employee="${profile.employee_id}"] img`);
        avatarElements.forEach(avatar => {
            if (profile.profile_picture_url) {
                avatar.src = profile.profile_picture_url;
            }
        });
    });
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        showLoading('dashboard-content');
        
        // Load multiple data sources
        const [statusResponse, leadsResponse] = await Promise.all([
            fetch('/api/status'),
            fetch('/api/leads/statistics')
        ]).catch(error => {
            console.warn('Some API endpoints may not be available:', error);
            return [null, null];
        });
        
        const statusData = statusResponse ? await statusResponse.json() : null;
        const leadsData = leadsResponse ? await leadsResponse.json() : null;
        
        // Update dashboard UI
        updateDashboardMetrics(statusData, leadsData);
        
        hideLoading('dashboard-content');
        console.log('✅ Dashboard data loaded');
    } catch (error) {
        console.error('❌ Failed to load dashboard data:', error);
        hideLoading('dashboard-content');
        showNotification('Some dashboard data may be unavailable', 'warning');
    }
}

/**
 * Update dashboard metrics
 */
function updateDashboardMetrics(statusData, leadsData) {
    // Update employee status
    const employeeList = document.querySelector('.employee-status-list');
    if (employeeList && statusData.employees) {
        employeeList.innerHTML = '';
        Object.entries(statusData.employees).forEach(([id, employee]) => {
            const statusDot = employee.assistant_configured && employee.webhook_configured ? 'online' : 'offline';
            employeeList.innerHTML += `
                <div class="employee-status-item">
                    <div class="status-dot ${statusDot}"></div>
                    <div>
                        <div class="employee-name">${employee.name}</div>
                        <div class="employee-role">${employee.role}</div>
                    </div>
                </div>
            `;
        });
    }
    
    // Update lead metrics
    if (leadsData) {
        updateMetric('total-leads', leadsData.total || 0);
        updateMetric('validated-leads', leadsData.validated || 0);
        updateMetric('contacted-leads', leadsData.outreach_sent || 0);
        updateMetric('converted-leads', leadsData.converted || 0);
    }
    
    // Update pending operations
    updateMetric('pending-operations', statusData.pending_tool_calls || 0);
}

/**
 * Update a metric value
 */
function updateMetric(metricId, value) {
    const element = document.getElementById(metricId);
    if (element) {
        element.textContent = value;
    }
}

/**
 * Load leads data
 */
async function loadLeadsData() {
    try {
        showLoading('leads-table-container');
        
        const response = await fetch('/api/leads?limit=50');
        const data = await response.json();
        
        // Update leads table
        updateLeadsTable(data.leads || []);
        
        hideLoading('leads-table-container');
        console.log('✅ Leads data loaded');
    } catch (error) {
        console.error('❌ Failed to load leads data:', error);
        hideLoading('leads-table-container');
        showNotification('Failed to load leads data', 'error');
    }
}

/**
 * Update leads table
 */
function updateLeadsTable(leads) {
    const tableBody = document.querySelector('.leads-table tbody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    leads.forEach(lead => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="business-info">
                    <strong>${lead.business_name || 'Unknown'}</strong>
                    <small>${lead.industry || 'Unknown Industry'}</small>
                </div>
            </td>
            <td>
                <div class="contact-info">
                    <strong>${lead.contact_name || 'No contact'}</strong>
                    <small>${lead.email || 'No email'}</small>
                    <small>${lead.phone || 'No phone'}</small>
                </div>
            </td>
            <td>${lead.city || ''}, ${lead.state || ''}</td>
            <td>
                <span class="score ${getScoreClass(lead.average_score)}">
                    ${lead.average_score ? lead.average_score.toFixed(1) : 'N/A'}
                </span>
            </td>
            <td>
                <span class="status ${lead.validated ? 'qualified' : 'new'}">
                    ${lead.validated ? 'Validated' : 'New'}
                </span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editLead('${lead.id}')">✏️</button>
                    <button class="btn-icon" onclick="deleteLead('${lead.id}')">🗑️</button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

/**
 * Get score class for styling
 */
function getScoreClass(score) {
    if (!score) return 'low';
    if (score >= 4) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
}

/**
 * Select employee for chat
 */
function selectEmployee(employeeId) {
    console.log(`🔄 Switching to employee: ${employeeId}`);
    
    currentEmployee = employeeId;
    
    // Update UI
    const teamMembers = document.querySelectorAll('.team-member');
    teamMembers.forEach(member => {
        member.classList.remove('active');
        if (member.dataset.employee === employeeId) {
            member.classList.add('active');
        }
    });
    
    // Update chat header
    updateChatHeader(employeeId);
    
    // Clear current conversation
    clearChatMessages();
    currentThread = null;
    currentRun = null;
    
    // Show welcome message for selected employee
    showWelcomeMessage(employeeId);
    
    console.log(`👤 Selected employee: ${employeeId}`);
}

/**
 * Show welcome message for employee
 */
function showWelcomeMessage(employeeId) {
    const welcomeMessages = {
        'brenden': 'Hi! I\'m AI Brenden, your Lead Research Specialist. I can help you find and qualify potential leads for your business. What kind of leads are you looking for today?',
        'van': 'Hello! I\'m AI Van, your Digital Marketing Designer. I can help you create landing pages, design marketing materials, and develop digital campaigns. How can I assist you?',
        'angel': 'Hi there! I\'m AI Angel, your Voice Outreach Manager. I\'m currently being configured for voice calling capabilities. In the meantime, I can help you plan your outreach strategy!'
    };
    
    const message = welcomeMessages[employeeId] || 'Hello! How can I help you today?';
    setTimeout(() => {
        addMessageToChat('assistant', message);
    }, 500);
}
/**
 * Update chat header with employee info
 */
function updateChatHeader(employeeId) {
    const employeeConfig = {
        brenden: { 
            name: 'AI Brenden', 
            role: 'Lead Research Specialist',
            description: 'Specializes in finding and qualifying high-quality leads for your business'
        },
        van: { 
            name: 'AI Van', 
            role: 'Digital Marketing Designer',
            description: 'Creates compelling landing pages and marketing materials'
        },
        angel: { 
            name: 'AI Angel', 
            role: 'Voice Outreach Manager',
            description: 'Handles voice calling and outreach campaigns (currently in setup)'
        }
    };
    
    const employee = employeeConfig[employeeId];
    if (employee) {
        const nameElement = document.querySelector('.employee-details h3');
        const roleElement = document.querySelector('.role-tag');
        const descElement = document.querySelector('.employee-description p');
        
        if (nameElement) nameElement.textContent = employee.name;
        if (roleElement) roleElement.textContent = employee.role;
        if (descElement) descElement.textContent = employee.description;
    }
}

/**
 * Handle chat form submission
 */
async function handleChatSubmit(e) {
    e.preventDefault();
    
    if (isProcessing) return;
    
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    try {
        isProcessing = true;
        updateSendButton(true);
        
        // Add user message to chat
        addMessageToChat('user', message);
        messageInput.value = '';
        updateCharacterCount();
        
        // Show typing indicator
        showTypingIndicator();
        
        // Send to API
        const response = await fetch('/api/ask', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message,
                employee: currentEmployee,
                thread_id: currentThread
            })
        });
        
        const data = await response.json();
        
        // Hide typing indicator
        hideTypingIndicator();
        
        if (response.ok) {
            currentThread = data.thread_id;
            currentRun = data.run_id;
            
            if (data.status === 'completed') {
                addMessageToChat('assistant', data.message);
            } else if (data.status === 'requires_action') {
                addMessageToChat('assistant', `${getEmployeeName(currentEmployee)} is processing your request with external tools...`);
                // Poll for completion
                pollForCompletion(data.thread_id, data.run_id, currentEmployee);
            }
        } else {
            throw new Error(data.message || 'Request failed');
        }
        
    } catch (error) {
        console.error('❌ Chat error:', error);
        hideTypingIndicator();
        addMessageToChat('assistant', 'Sorry, I encountered an error processing your request.');
        showNotification('Failed to send message', 'error');
    } finally {
        isProcessing = false;
        updateSendButton(false);
    }
}

/**
 * Get employee display name
 */
function getEmployeeName(employeeId) {
    const employeeNames = {
        'brenden': 'AI Brenden',
        'van': 'AI Van', 
        'angel': 'AI Angel'
    };
    return employeeNames[employeeId] || 'AI Assistant';
}

/**
 * Show typing indicator
 */
function showTypingIndicator() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant typing-message';
    typingDiv.innerHTML = `
        <div class="message-content">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(typingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Hide typing indicator
 */
function hideTypingIndicator() {
    const typingMessage = document.querySelector('.typing-message');
    if (typingMessage) {
        typingMessage.remove();
    }
}

/**
 * Add message to chat interface
 */
function addMessageToChat(role, content) {
    const messagesContainer = document.querySelector('.chat-messages');
    if (!messagesContainer) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    messageDiv.innerHTML = `
        <div class="message-content">${content}</div>
        <div class="message-time">${time}</div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

/**
 * Clear chat messages
 */
function clearChatMessages() {
    const messagesContainer = document.querySelector('.chat-messages');
    if (messagesContainer) {
        // Keep the welcome message, remove others
        const welcomeMessage = messagesContainer.querySelector('.welcome-message');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }
    }
}

/**
 * Poll for completion of async operations
 */
async function pollForCompletion(threadId, runId, employeeId) {
    const maxAttempts = 30;
    let attempts = 0;
    
    const poll = async () => {
        try {
            const response = await fetch(`/api/run-status?thread_id=${threadId}&run_id=${runId}&employee_id=${employeeId}`);
            const data = await response.json();
            
            if (data.status === 'completed') {
                hideTypingIndicator();
                addMessageToChat('assistant', data.message);
                return;
            } else if (data.status === 'failed') {
                hideTypingIndicator();
                addMessageToChat('assistant', 'Sorry, the request failed to complete.');
                return;
            }
            
            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(poll, 2000);
            } else {
                hideTypingIndicator();
                addMessageToChat('assistant', 'Request timed out. Please try again.');
            }
        } catch (error) {
            console.error('❌ Polling error:', error);
            hideTypingIndicator();
            addMessageToChat('assistant', 'Error checking request status.');
        }
    };
    
    setTimeout(poll, 2000);
}

/**
 * Update send button state
 */
function updateSendButton(disabled) {
    const sendButton = document.querySelector('.send-button');
    if (sendButton) {
        sendButton.disabled = disabled;
    }
}

/**
 * Update character count
 */
function updateCharacterCount() {
    const messageInput = document.getElementById('messageInput');
    const charCount = document.querySelector('.character-count');
    
    if (messageInput && charCount) {
        const length = messageInput.value.length;
        const maxLength = 1000;
        
        charCount.textContent = `${length}/${maxLength}`;
        
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

/**
 * Handle logo upload
 */
async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
        showLoading('logo-upload-area');
        
        const formData = new FormData();
        formData.append('logo', file);
        
        const response = await fetch('/api/storage/logo', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Logo uploaded successfully!', 'success');
            // Update logo in UI
            const logoElements = document.querySelectorAll('.sidebar-logo, .company-logo img, .logo-preview');
            logoElements.forEach(logo => {
                logo.src = data.logo_url;
                logo.style.display = 'block';
            });
            
            // Hide no-logo message
            const noLogoMessage = document.getElementById('no-logo-message');
            if (noLogoMessage) {
                noLogoMessage.style.display = 'none';
            }
        } else {
            throw new Error(data.message || 'Upload failed');
        }
        
    } catch (error) {
        console.error('❌ Logo upload error:', error);
        showNotification('Failed to upload logo', 'error');
    } finally {
        hideLoading('logo-upload-area');
    }
}

/**
 * Handle color changes
 */
async function handleColorChange(e) {
    const colorType = e.target.dataset.color;
    const colorValue = e.target.value;
    
    try {
        const response = await fetch('/api/branding/colors', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                [`${colorType}_color`]: colorValue
            })
        });
        
        if (response.ok) {
            // Apply color immediately
            document.documentElement.style.setProperty(`--${colorType}-color`, colorValue);
            // Update text input
            e.target.nextElementSibling.value = colorValue;
            showNotification('Color updated successfully!', 'success');
        } else {
            throw new Error('Failed to update color');
        }
        
    } catch (error) {
        console.error('❌ Color update error:', error);
        showNotification('Failed to update color', 'error');
    }
}

/**
 * Handle avatar upload
 */
async function handleAvatarUpload(e) {
    const file = e.target.files[0];
    const employeeId = e.target.dataset.employee;
    
    if (!file || !employeeId) return;
    
    try {
        showLoading(`avatar-${employeeId}`);
        
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('employee_id', employeeId);
        
        const response = await fetch('/api/storage/employee-avatar', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showNotification('Avatar uploaded successfully!', 'success');
            // Update avatar in UI
            const avatarElements = document.querySelectorAll(`[data-employee="${employeeId}"] img, .employee-avatar-img`);
            avatarElements.forEach(avatar => {
                if (avatar.closest(`[data-employee="${employeeId}"]`) || avatar.classList.contains('employee-avatar-img')) {
                    avatar.src = data.avatar_url;
                }
            });
        } else {
            throw new Error(data.message || 'Upload failed');
        }
        
    } catch (error) {
        console.error('❌ Avatar upload error:', error);
        showNotification('Failed to upload avatar', 'error');
    } finally {
        hideLoading(`avatar-${employeeId}`);
    }
}

/**
 * Switch tabs in employee interface
 */
function switchTab(tabName) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    // Update tab content
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-content`) {
            content.classList.add('active');
        }
    });
}

/**
 * Show loading state
 */
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('loading');
    }
}

/**
 * Hide loading state
 */
function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('loading');
    }
}

/**
 * Show notification
 */
function showNotification(message, type = 'info') {
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

/**
 * Handle export functionality
 */
async function handleExport(e) {
    const format = e.target.dataset.format;
    const type = e.target.dataset.type;
    
    try {
        showLoading('export-area');
        
        let url = '';
        if (type === 'leads') {
            url = `/api/leads/export?format=${format}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(downloadUrl);
            
            showNotification('Export completed successfully!', 'success');
        } else {
            throw new Error('Export failed');
        }
        
    } catch (error) {
        console.error('❌ Export error:', error);
        showNotification('Failed to export data', 'error');
    } finally {
        hideLoading('export-area');
    }
}

/**
 * Load status data
 */
async function loadStatusData() {
    try {
        showLoading('status-content');
        
        const response = await fetch('/api/status');
        const data = await response.json();
        
        // Update status UI
        updateStatusDisplay(data);
        
        hideLoading('status-content');
        console.log('✅ Status data loaded');
    } catch (error) {
        console.error('❌ Failed to load status data:', error);
        hideLoading('status-content');
        showNotification('Failed to load status data', 'error');
    }
}

/**
 * Update status display
 */
function updateStatusDisplay(statusData) {
    // Update employee status cards
    const statusGrid = document.querySelector('.status-grid');
    if (statusGrid && statusData.employees) {
        statusGrid.innerHTML = '';
        
        Object.entries(statusData.employees).forEach(([id, employee]) => {
            const isOnline = employee.assistant_configured && employee.webhook_configured;
            const statusCard = document.createElement('div');
            statusCard.className = 'status-card';
            
            statusCard.innerHTML = `
                <div class="status-header">
                    <h3>${employee.name}</h3>
                    <div class="status-indicator ${isOnline ? 'online' : 'offline'}"></div>
                </div>
                <div class="status-content">
                    <div class="status-item">
                        <span>Assistant</span>
                        <span class="status-badge ${employee.assistant_configured ? 'online' : 'offline'}">
                            ${employee.assistant_configured ? 'Connected' : 'Not Connected'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span>Webhook</span>
                        <span class="status-badge ${employee.webhook_configured ? 'online' : 'offline'}">
                            ${employee.webhook_configured ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <div class="status-item">
                        <span>Role</span>
                        <span>${employee.role}</span>
                    </div>
                </div>
            `;
            
            statusGrid.appendChild(statusCard);
        });
    }
}

/**
 * Load employee data (placeholder)
 */
function loadEmployeeData() {
    console.log('Loading employee data...');
}

/**
 * Send quick message
 */
function sendQuickMessage(message) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.value = message;
        const event = new Event('submit');
        document.getElementById('chat-form').dispatchEvent(event);
    }
}

/**
 * Clear chat
 */
function clearChat() {
    clearChatMessages();
    currentThread = null;
    currentRun = null;
    showNotification('Chat cleared', 'info');
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// Global functions for inline event handlers
window.editLead = function(leadId) {
    console.log('Edit lead:', leadId);
    showNotification('Edit functionality coming soon', 'info');
};

window.deleteLead = function(leadId) {
    if (confirm('Are you sure you want to delete this lead?')) {
        console.log('Delete lead:', leadId);
        showNotification('Delete functionality coming soon', 'info');
    }
};

window.sendQuickMessage = sendQuickMessage;
window.clearChat = clearChat;
window.toggleMobileMenu = toggleMobileMenu;

// Error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    showNotification('An unexpected error occurred', 'error');
});

window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    showNotification('An unexpected error occurred', 'error');
    e.preventDefault();
});

console.log('📱 Main application script loaded successfully');