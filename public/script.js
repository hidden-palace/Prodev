// Global state
let currentEmployee = 'brenden';
let currentThreadId = null;
let isProcessing = false;
let conversationHistory = {}; // Store conversation history per employee
let currentFilters = {}; // Store current lead filters

// Employee configurations
const employees = {
  brenden: {
    name: 'AI Brenden',
    role: 'lead scraper',
    specialty: 'Lead Research Specialist',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    description: 'Expert data researcher specializing in B2B lead generation. I extract high-quality prospects from LinkedIn, Google Maps, and Yellow Pages with precision and attention to detail.',
    quickActions: [
      { icon: '🔍', text: 'Find florists in Los Angeles', action: 'Find florists in Los Angeles area' },
      { icon: '📊', text: 'Research wedding vendors', action: 'Research wedding vendors and event planners' },
      { icon: '🏢', text: 'Corporate clients search', action: 'Find corporate clients who need floral services' },
      { icon: '📋', text: 'Validate lead data', action: 'Validate and score the latest lead data' }
    ]
  },
  van: {
    name: 'AI Van',
    role: 'page operator',
    specialty: 'Digital Marketing Designer',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    description: 'Creative digital marketing specialist focused on landing page design and conversion optimization. I create compelling pages that turn visitors into customers.',
    quickActions: [
      { icon: '🎨', text: 'Create Valentine\'s page', action: 'Create a Valentine\'s Day landing page for flower sales' },
      { icon: '💼', text: 'Corporate services page', action: 'Design a landing page for corporate floral services' },
      { icon: '💒', text: 'Wedding packages page', action: 'Create a wedding floral packages landing page' },
      { icon: '📱', text: 'Mobile-first design', action: 'Design a mobile-optimized flower delivery page' }
    ]
  },
  angel: {
    name: 'AI Angel',
    role: 'voice caller',
    specialty: 'Voice Outreach Manager',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop&crop=face',
    description: 'Professional voice outreach specialist for customer engagement and lead qualification. I handle phone campaigns with a personal touch.',
    quickActions: [
      { icon: '📞', text: 'Start call campaign', action: 'Start a voice outreach campaign for new leads' },
      { icon: '📝', text: 'Prepare call script', action: 'Prepare a call script for florist outreach' },
      { icon: '📊', text: 'Call performance review', action: 'Review call campaign performance and metrics' },
      { icon: '🎯', text: 'Qualify leads', action: 'Qualify leads through voice conversations' }
    ]
  }
};

// DOM elements
let chatMessages, messageInput, sendButton, charCount;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  initializeNavigation();
  initializeEmployeeSelection();
  initializeChatInterface();
  initializeBranding();
  initializeMobileMenu();
  initializeLeadsPage();
  initializeBrandingUploads();
  
  // Load initial employee
  switchEmployee('brenden');
  
  // Load dashboard metrics
  loadDashboardMetrics();
  
  // Load branding
  loadBranding();
  
  console.log('🚀 Orchid Republic Command Center initialized');
});

function initializeElements() {
  chatMessages = document.getElementById('chatMessages');
  messageInput = document.getElementById('messageInput');
  sendButton = document.getElementById('sendButton');
  charCount = document.getElementById('charCount');
}

function initializeNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const contentSections = document.querySelectorAll('.content-section');
  
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const sectionId = item.dataset.section;
      
      // Update active nav item
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // Show corresponding section
      contentSections.forEach(section => section.classList.remove('active'));
      const targetSection = document.getElementById(`${sectionId}-section`);
      if (targetSection) {
        targetSection.classList.add('active');
      }
      
      // Load section-specific data
      if (sectionId === 'leads') {
        loadLeadsData();
      } else if (sectionId === 'dashboard') {
        loadDashboardMetrics();
      }
    });
  });
}

function initializeEmployeeSelection() {
  const teamMembers = document.querySelectorAll('.team-member');
  
  teamMembers.forEach(member => {
    member.addEventListener('click', () => {
      const employeeId = member.dataset.employee;
      switchEmployee(employeeId);
      
      // Update active team member
      teamMembers.forEach(m => m.classList.remove('active'));
      member.classList.add('active');
    });
  });
}

function initializeChatInterface() {
  const chatForm = document.getElementById('chatForm');
  const newChatBtn = document.getElementById('newChatBtn');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Chat form submission
  if (chatForm) {
    chatForm.addEventListener('submit', handleChatSubmit);
  }
  
  // New chat button
  if (newChatBtn) {
    newChatBtn.addEventListener('click', startNewChat);
  }
  
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      
      // Update active tab
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show corresponding content
      tabContents.forEach(content => content.classList.remove('active'));
      const targetContent = document.getElementById(`${tabId}-tab`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
  
  // Character count
  if (messageInput && charCount) {
    messageInput.addEventListener('input', updateCharacterCount);
  }
  
  // Auto-resize textarea
  if (messageInput) {
    messageInput.addEventListener('input', autoResizeTextarea);
  }
}

function initializeBranding() {
  const primaryPicker = document.getElementById('primaryPicker');
  const primaryInput = document.getElementById('primaryInput');
  const secondaryPicker = document.getElementById('secondaryPicker');
  const secondaryInput = document.getElementById('secondaryInput');
  const accentPicker = document.getElementById('accentPicker');
  const accentInput = document.getElementById('accentInput');
  const saveColorsBtn = document.getElementById('saveColorsBtn');
  
  // Sync color picker with text input
  if (primaryPicker && primaryInput) {
    primaryPicker.addEventListener('change', (e) => {
      primaryInput.value = e.target.value.toUpperCase();
    });
    primaryInput.addEventListener('change', (e) => {
      primaryPicker.value = e.target.value;
    });
  }
  
  if (secondaryPicker && secondaryInput) {
    secondaryPicker.addEventListener('change', (e) => {
      secondaryInput.value = e.target.value.toUpperCase();
    });
    secondaryInput.addEventListener('change', (e) => {
      secondaryPicker.value = e.target.value;
    });
  }
  
  if (accentPicker && accentInput) {
    accentPicker.addEventListener('change', (e) => {
      accentInput.value = e.target.value.toUpperCase();
    });
    accentInput.addEventListener('change', (e) => {
      accentPicker.value = e.target.value;
    });
  }
  
  // Save colors
  if (saveColorsBtn) {
    saveColorsBtn.addEventListener('click', saveColorScheme);
  }
}

function initializeBrandingUploads() {
  // Logo upload functionality
  const logoUploadArea = document.getElementById('logoUploadArea');
  const logoFileInput = document.getElementById('logoFileInput');
  const logoPreview = document.getElementById('logoPreview');
  const saveLogoBtn = document.getElementById('saveLogoBtn');
  
  if (logoUploadArea && logoFileInput) {
    logoUploadArea.addEventListener('click', () => logoFileInput.click());
    logoUploadArea.addEventListener('dragover', handleDragOver);
    logoUploadArea.addEventListener('drop', handleLogoDrop);
    logoFileInput.addEventListener('change', handleLogoSelect);
  }
  
  if (saveLogoBtn) {
    saveLogoBtn.addEventListener('click', saveLogo);
  }
  
  // Initialize employee profile grid
  initializeEmployeeProfiles();
}

function handleDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('dragover');
}

function handleLogoDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('dragover');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    handleLogoFile(files[0]);
  }
}

function handleLogoSelect(e) {
  const file = e.target.files[0];
  if (file) {
    handleLogoFile(file);
  }
}

function handleLogoFile(file) {
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
  if (!validTypes.includes(file.type)) {
    showNotification('Please select a PNG, JPG, or SVG file', 'error');
    return;
  }
  
  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    showNotification('File size must be less than 2MB', 'error');
    return;
  }
  
  // Preview the image
  const reader = new FileReader();
  reader.onload = (e) => {
    const logoPreview = document.getElementById('logoPreview');
    const saveLogoBtn = document.getElementById('saveLogoBtn');
    
    if (logoPreview && saveLogoBtn) {
      logoPreview.src = e.target.result;
      logoPreview.style.display = 'block';
      saveLogoBtn.style.display = 'inline-flex';
      saveLogoBtn.dataset.fileData = e.target.result;
      saveLogoBtn.dataset.fileName = file.name;
    }
  };
  reader.readAsDataURL(file);
}

async function saveLogo() {
  const saveLogoBtn = document.getElementById('saveLogoBtn');
  const fileData = saveLogoBtn.dataset.fileData;
  const fileName = saveLogoBtn.dataset.fileName;
  
  if (!fileData) {
    showNotification('No logo selected', 'error');
    return;
  }
  
  try {
    // In a real implementation, you would upload to a file storage service
    // For now, we'll store the data URL in localStorage and database
    const logoUrl = fileData; // This would be the actual file URL in production
    
    // Save to database via API
    const response = await fetch('/api/branding/logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        logo_url: logoUrl,
        file_name: fileName
      })
    });
    
    if (response.ok) {
      // Update sidebar logo
      updateSidebarLogo(logoUrl);
      showNotification('Logo saved successfully!', 'success');
      saveLogoBtn.style.display = 'none';
    } else {
      throw new Error('Failed to save logo');
    }
  } catch (error) {
    console.error('Error saving logo:', error);
    showNotification('Failed to save logo', 'error');
  }
}

function updateSidebarLogo(logoUrl) {
  const logoIcon = document.getElementById('logoIcon');
  const sidebarLogo = document.getElementById('sidebarLogo');
  
  if (logoUrl && sidebarLogo && logoIcon) {
    sidebarLogo.src = logoUrl;
    sidebarLogo.style.display = 'block';
    logoIcon.style.display = 'none';
  } else if (logoIcon && sidebarLogo) {
    sidebarLogo.style.display = 'none';
    logoIcon.style.display = 'flex';
  }
}

function initializeEmployeeProfiles() {
  const employeeProfileGrid = document.getElementById('employeeProfileGrid');
  if (!employeeProfileGrid) return;
  
  employeeProfileGrid.innerHTML = '';
  
  Object.entries(employees).forEach(([employeeId, employee]) => {
    const profileCard = document.createElement('div');
    profileCard.className = 'employee-profile-card';
    profileCard.innerHTML = `
      <div class="employee-profile-header">
        <img src="${employee.avatar}" alt="${employee.name}" class="employee-current-avatar" id="avatar-${employeeId}">
        <div class="employee-info">
          <h4>${employee.name}</h4>
          <p>${employee.specialty}</p>
        </div>
      </div>
      <div class="profile-upload-area" data-employee="${employeeId}">
        <div class="upload-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21,15 16,10 5,21"></polyline>
          </svg>
        </div>
        <div class="upload-text">Upload Profile Picture</div>
        <div class="upload-hint">1:1 ratio, PNG/JPG, max 1MB</div>
      </div>
      <input type="file" class="file-input" id="profileInput-${employeeId}" accept=".png,.jpg,.jpeg" />
      <button class="btn primary" id="saveProfile-${employeeId}" style="display: none; margin-top: 12px;">Save Profile Picture</button>
    `;
    
    employeeProfileGrid.appendChild(profileCard);
    
    // Add event listeners
    const uploadArea = profileCard.querySelector('.profile-upload-area');
    const fileInput = profileCard.querySelector(`#profileInput-${employeeId}`);
    const saveBtn = profileCard.querySelector(`#saveProfile-${employeeId}`);
    
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => handleProfilePictureSelect(e, employeeId));
    saveBtn.addEventListener('click', () => saveProfilePicture(employeeId));
  });
}

function handleProfilePictureSelect(e, employeeId) {
  const file = e.target.files[0];
  if (!file) return;
  
  // Validate file type
  const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!validTypes.includes(file.type)) {
    showNotification('Please select a PNG or JPG file', 'error');
    return;
  }
  
  // Validate file size (1MB)
  if (file.size > 1024 * 1024) {
    showNotification('File size must be less than 1MB', 'error');
    return;
  }
  
  // Preview the image
  const reader = new FileReader();
  reader.onload = (e) => {
    const uploadArea = document.querySelector(`[data-employee="${employeeId}"]`);
    const saveBtn = document.getElementById(`saveProfile-${employeeId}`);
    
    if (uploadArea && saveBtn) {
      // Replace upload area content with preview
      uploadArea.innerHTML = `
        <img src="${e.target.result}" alt="Profile preview" class="profile-preview">
        <div class="upload-text">Click to change</div>
      `;
      
      saveBtn.style.display = 'inline-flex';
      saveBtn.dataset.fileData = e.target.result;
      saveBtn.dataset.fileName = file.name;
    }
  };
  reader.readAsDataURL(file);
}

async function saveProfilePicture(employeeId) {
  const saveBtn = document.getElementById(`saveProfile-${employeeId}`);
  const fileData = saveBtn.dataset.fileData;
  const fileName = saveBtn.dataset.fileName;
  
  if (!fileData) {
    showNotification('No profile picture selected', 'error');
    return;
  }
  
  try {
    // Save to database via API
    const response = await fetch('/api/branding/employee-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        employee_id: employeeId,
        profile_picture_url: fileData,
        file_name: fileName
      })
    });
    
    if (response.ok) {
      // Update employee avatar in the config and UI
      employees[employeeId].avatar = fileData;
      updateEmployeeAvatars(employeeId, fileData);
      showNotification(`${employees[employeeId].name} profile picture saved!`, 'success');
      saveBtn.style.display = 'none';
    } else {
      throw new Error('Failed to save profile picture');
    }
  } catch (error) {
    console.error('Error saving profile picture:', error);
    showNotification('Failed to save profile picture', 'error');
  }
}

function updateEmployeeAvatars(employeeId, avatarUrl) {
  // Update current avatar in profile card
  const currentAvatar = document.getElementById(`avatar-${employeeId}`);
  if (currentAvatar) {
    currentAvatar.src = avatarUrl;
  }
  
  // Update avatar in team panel
  const teamMember = document.querySelector(`[data-employee="${employeeId}"] .member-avatar img`);
  if (teamMember) {
    teamMember.src = avatarUrl;
  }
  
  // Update avatar in chat header if this is the current employee
  if (currentEmployee === employeeId) {
    const chatAvatar = document.getElementById('current-employee-avatar');
    if (chatAvatar) {
      chatAvatar.src = avatarUrl;
    }
  }
}

function initializeLeadsPage() {
  // Export dropdown functionality
  const exportDropdown = document.getElementById('exportDropdown');
  const exportLeadsBtn = document.getElementById('exportLeadsBtn');
  const exportOptions = document.querySelectorAll('.export-option');
  
  if (exportLeadsBtn) {
    exportLeadsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportDropdown.classList.toggle('active');
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (exportDropdown && !exportDropdown.contains(e.target)) {
      exportDropdown.classList.remove('active');
    }
  });
  
  // Export options
  exportOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      const format = e.target.dataset.format;
      exportLeads(format);
      exportDropdown.classList.remove('active');
    });
  });
  
  // Filter functionality
  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', applyLeadFilters);
  }
  
  // Initialize filters
  initializeLeadFilters();
}

function initializeLeadFilters() {
  const sourcePlatformFilter = document.getElementById('sourcePlatformFilter');
  const dateFromFilter = document.getElementById('dateFromFilter');
  const dateToFilter = document.getElementById('dateToFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  // Set default date range (last 30 days)
  if (dateToFilter) {
    dateToFilter.value = new Date().toISOString().split('T')[0];
  }
  if (dateFromFilter) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    dateFromFilter.value = thirtyDaysAgo.toISOString().split('T')[0];
  }
}

function applyLeadFilters() {
  const sourcePlatformFilter = document.getElementById('sourcePlatformFilter');
  const dateFromFilter = document.getElementById('dateFromFilter');
  const dateToFilter = document.getElementById('dateToFilter');
  const statusFilter = document.getElementById('statusFilter');
  
  currentFilters = {};
  
  if (sourcePlatformFilter && sourcePlatformFilter.value) {
    currentFilters.source_platform = sourcePlatformFilter.value;
  }
  
  if (dateFromFilter && dateFromFilter.value) {
    currentFilters.date_from = dateFromFilter.value;
  }
  
  if (dateToFilter && dateToFilter.value) {
    currentFilters.date_to = dateToFilter.value;
  }
  
  if (statusFilter && statusFilter.value) {
    currentFilters.validated = statusFilter.value;
  }
  
  console.log('Applying filters:', currentFilters);
  loadLeadsData();
}

async function exportLeads(format) {
  try {
    showNotification(`Preparing ${format.toUpperCase()} export...`, 'info');
    
    // Build query parameters
    const params = new URLSearchParams({
      format: format,
      ...currentFilters
    });
    
    const response = await fetch(`/api/leads/export?${params}`);
    
    if (!response.ok) {
      throw new Error('Export failed');
    }
    
    // Get the blob and create download
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_export_${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification(`${format.toUpperCase()} export completed!`, 'success');
  } catch (error) {
    console.error('Export error:', error);
    showNotification(`Export failed: ${error.message}`, 'error');
  }
}
function initializeMobileMenu() {
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const sidebar = document.getElementById('sidebar');
  
  if (mobileMenuToggle && sidebar) {
    mobileMenuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('mobile-open');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!sidebar.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });
  }
}

function saveCurrentConversation() {
  if (!chatMessages || !currentEmployee) return;
  
  // Save current conversation state with employee-specific thread
  conversationHistory[currentEmployee] = {
    threadId: currentThreadId, // This thread belongs to the current employee
    messages: chatMessages.innerHTML,
    timestamp: Date.now()
  };
  
  console.log(`💾 Saved conversation for ${employees[currentEmployee]?.name}:`, {
    employee: currentEmployee,
    threadId: currentThreadId,
    messageCount: chatMessages.children.length
  });
}

function loadConversation(employeeId) {
  if (!chatMessages) return;
  
  const savedConversation = conversationHistory[employeeId];
  
  if (savedConversation && savedConversation.messages) {
    // Restore saved conversation with employee-specific thread
    chatMessages.innerHTML = savedConversation.messages;
    currentThreadId = savedConversation.threadId; // Use the thread that belongs to this employee
    
    // Re-attach event listeners to any interactive elements
    reattachEventListeners();
    
    scrollToBottom();
    
    console.log(`📂 Loaded conversation for ${employees[employeeId]?.name}:`, {
      employee: employeeId,
      threadId: currentThreadId,
      messageCount: chatMessages.children.length
    });
  } else {
    // Show welcome message for new conversation
    clearChatMessages();
    showWelcomeMessage(employees[employeeId]);
    currentThreadId = null; // No thread yet for this employee
    
    console.log(`🆕 New conversation for ${employees[employeeId]?.name}:`, {
      employee: employeeId,
      threadId: currentThreadId
    });
  }
}

function reattachEventListeners() {
  // Re-attach event listeners for HTML preview buttons
  const viewFullBtns = chatMessages.querySelectorAll('.view-full-btn');
  viewFullBtns.forEach(btn => {
    btn.onclick = () => toggleHtmlView(btn);
  });
  
  const copyBtns = chatMessages.querySelectorAll('.copy-btn');
  copyBtns.forEach(btn => {
    const content = btn.getAttribute('data-content');
    if (content) {
      btn.onclick = () => copyToClipboard(btn, content);
    }
  });
  
  const downloadBtns = chatMessages.querySelectorAll('.download-btn');
  downloadBtns.forEach(btn => {
    const content = btn.getAttribute('data-content');
    if (content) {
      btn.onclick = () => downloadHtml(content);
    }
  });
}

function switchEmployee(employeeId) {
  // Save current conversation before switching (with current employee's thread)
  if (currentEmployee && currentEmployee !== employeeId) {
    saveCurrentConversation();
    console.log(`🔄 Switching from ${employees[currentEmployee]?.name} to ${employees[employeeId]?.name}`);
  }
  
  // Update current employee
  const previousEmployee = currentEmployee;
  currentEmployee = employeeId;
  
  const employee = employees[employeeId];
  if (!employee) return;
  
  // Update header information
  const avatarImg = document.getElementById('current-employee-avatar');
  const nameEl = document.getElementById('current-employee-name');
  const roleEl = document.getElementById('current-employee-role');
  const specialtyEl = document.getElementById('current-employee-specialty');
  const descriptionEl = document.getElementById('employee-description');
  const newChatBtn = document.getElementById('newChatBtn');
  
  if (avatarImg) avatarImg.src = employee.avatar;
  if (nameEl) nameEl.textContent = employee.name;
  if (roleEl) roleEl.textContent = employee.role;
  if (specialtyEl) specialtyEl.textContent = employee.specialty;
  if (descriptionEl) descriptionEl.textContent = employee.description;
  if (newChatBtn) newChatBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      <path d="M12 7v6m3-3H9"></path>
    </svg>
    New Chat with ${employee.name}
  `;
  
  // Update quick actions
  updateQuickActions(employee.quickActions);
  
  // Load conversation for this employee (with their own thread)
  loadConversation(employeeId);
  
  console.log(`✅ Successfully switched to ${employee.name} (${employeeId})`);
}

function updateQuickActions(quickActions) {
  const quickActionsContainer = document.querySelector('.quick-actions');
  if (!quickActionsContainer) return;
  
  quickActionsContainer.innerHTML = '';
  
  quickActions.forEach(action => {
    const actionEl = document.createElement('div');
    actionEl.className = 'quick-action';
    actionEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      <span>${action.icon} ${action.text}</span>
    `;
    
    actionEl.addEventListener('click', () => {
      if (messageInput) {
        messageInput.value = action.action;
        messageInput.focus();
        updateCharacterCount();
      }
    });
    
    quickActionsContainer.appendChild(actionEl);
  });
}

function clearChatMessages() {
  if (chatMessages) {
    chatMessages.innerHTML = '';
  }
}

function showWelcomeMessage(employee) {
  if (!chatMessages) return;
  
  const welcomeEl = document.createElement('div');
  welcomeEl.className = 'welcome-message';
  welcomeEl.innerHTML = `
    <div class="welcome-avatar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </div>
    <div class="welcome-content">
      <h4>Hi! I'm ${employee.name}, your ${employee.specialty}.</h4>
      <p>Ask me to help with ${employee.role === 'lead scraper' ? 'lead generation and research' : employee.role === 'page operator' ? 'landing page design and marketing' : 'voice outreach and customer engagement'} or use the quick actions above.</p>
    </div>
  `;
  
  chatMessages.appendChild(welcomeEl);
  scrollToBottom();
}

function startNewChat() {
  console.log(`🗑️ Starting new chat with ${employees[currentEmployee]?.name} - clearing conversation history`);
  
  // Clear current conversation from memory for this employee only
  if (currentEmployee) {
    delete conversationHistory[currentEmployee];
  }
  
  // Reset thread and UI for current employee
  currentThreadId = null;
  clearChatMessages();
  showWelcomeMessage(employees[currentEmployee]);
  
  if (messageInput) {
    messageInput.value = '';
    messageInput.focus();
    updateCharacterCount();
  }
  
  console.log(`✅ New chat started with ${employees[currentEmployee]?.name}`);
}

async function handleChatSubmit(e) {
  e.preventDefault();
  
  if (isProcessing || !messageInput || !messageInput.value.trim()) {
    return;
  }
  
  const message = messageInput.value.trim();
  
  console.log(`💬 Sending message to ${employees[currentEmployee]?.name}:`, {
    employee: currentEmployee,
    threadId: currentThreadId,
    messageLength: message.length
  });
  
  // Add user message to chat
  addMessage(message, 'user');
  
  // Clear input and update UI
  messageInput.value = '';
  updateCharacterCount();
  setProcessingState(true);
  
  // Show typing indicator
  const typingIndicator = showTypingIndicator();
  
  try {
    const requestBody = {
      message: message,
      employee: currentEmployee, // Ensure we're sending to the correct employee
      thread_id: currentThreadId // Use employee-specific thread (or null for new thread)
    };
    
    console.log(`📤 API Request:`, requestBody);
    
    const response = await fetch('/api/ask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });
    
    const data = await response.json();
    
    console.log(`📥 API Response:`, {
      status: response.status,
      ok: response.ok,
      data: data
    });
    
    // Remove typing indicator
    if (typingIndicator) {
      typingIndicator.remove();
    }
    
    if (!response.ok) {
      throw new Error(data.details || data.error || 'Request failed');
    }
    
    // Update thread ID for this employee
    if (data.thread_id) {
      currentThreadId = data.thread_id;
      console.log(`🧵 Thread updated for ${employees[currentEmployee]?.name}: ${currentThreadId}`);
    }
    
    if (data.status === 'completed') {
      // Show assistant response
      addMessage(data.message, 'assistant');
    } else if (data.status === 'requires_action') {
      // Show tool calls status
      addMessage(`I'm working on your request using external tools. This may take a moment...`, 'assistant');
      
      // Start polling for completion
      pollForCompletion(data.thread_id, data.run_id);
    } else {
      addMessage(`Request status: ${data.status}`, 'assistant');
    }
    
  } catch (error) {
    console.error('Chat error:', error);
    
    // Remove typing indicator
    if (typingIndicator) {
      typingIndicator.remove();
    }
    
    addMessage(`Sorry, I encountered an error: ${error.message}`, 'assistant', true);
  } finally {
    setProcessingState(false);
  }
}

async function pollForCompletion(threadId, runId, maxAttempts = 60) {
  let attempts = 0;
  
  console.log(`🔄 Starting polling for ${employees[currentEmployee]?.name}:`, {
    threadId,
    runId,
    employee: currentEmployee
  });
  
  const poll = async () => {
    try {
      attempts++;
      
      const response = await fetch(`/api/run-status?thread_id=${threadId}&run_id=${runId}&employee_id=${currentEmployee}`);
      const data = await response.json();
      
      console.log(`📊 Poll attempt ${attempts}/${maxAttempts} for ${employees[currentEmployee]?.name}:`, {
        status: data.status,
        employee: data.employee_id,
        threadId: data.thread_id
      });
      
      if (!response.ok) {
        throw new Error(data.details || data.error || 'Status check failed');
      }
      
      if (data.status === 'completed') {
        addMessage(data.message, 'assistant');
        console.log(`✅ Task completed for ${employees[currentEmployee]?.name}`);
        return;
      } else if (data.status === 'failed') {
        addMessage(`Task failed: ${data.error || 'Unknown error'}`, 'assistant', true);
        console.error(`❌ Task failed for ${employees[currentEmployee]?.name}:`, data.error);
        return;
      } else if (attempts >= maxAttempts) {
        addMessage('Task is taking longer than expected. Please try again.', 'assistant', true);
        console.warn(`⏰ Polling timeout for ${employees[currentEmployee]?.name}`);
        return;
      }
      
      // Continue polling
      setTimeout(poll, 2000);
      
    } catch (error) {
      console.error('Polling error:', error);
      addMessage(`Error checking task status: ${error.message}`, 'assistant', true);
    }
  };
  
  // Start polling after a short delay
  setTimeout(poll, 2000);
}

function addMessage(content, role, isError = false) {
  if (!chatMessages) return;
  
  const messageEl = document.createElement('div');
  messageEl.className = `message ${role}`;
  
  if (isError) {
    messageEl.classList.add('error');
  }
  
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  // Check if content contains HTML (like landing page code)
  if (content.includes('<html') || content.includes('<!DOCTYPE')) {
    const htmlPreview = createHtmlPreview(content);
    messageContent.appendChild(htmlPreview);
  } else {
    messageContent.textContent = content;
  }
  
  const messageTime = document.createElement('div');
  messageTime.className = 'message-time';
  messageTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  messageEl.appendChild(messageContent);
  messageEl.appendChild(messageTime);
  
  chatMessages.appendChild(messageEl);
  scrollToBottom();
}

function createHtmlPreview(htmlContent) {
  const container = document.createElement('div');
  container.className = 'html-preview';
  
  const header = document.createElement('div');
  header.className = 'code-header';
  header.innerHTML = `
    <span class="code-type">Landing Page HTML</span>
    <button class="view-full-btn" onclick="toggleHtmlView(this)">View Full Code</button>
  `;
  
  const preview = document.createElement('div');
  preview.className = 'code-preview';
  preview.innerHTML = `<code>${escapeHtml(htmlContent.substring(0, 500))}${htmlContent.length > 500 ? '...' : ''}</code>`;
  
  const fullCode = document.createElement('div');
  fullCode.className = 'code-full';
  fullCode.style.display = 'none';
  fullCode.innerHTML = `<pre><code>${escapeHtml(htmlContent)}</code></pre>`;
  
  const actions = document.createElement('div');
  actions.className = 'code-actions';
  
  // Store content in data attributes for event handlers
  const escapedContent = escapeHtml(htmlContent).replace(/'/g, "\\'");
  actions.innerHTML = `
    <button class="copy-btn" data-content="${escapedContent}" onclick="copyToClipboard(this, this.getAttribute('data-content'))">Copy Code</button>
    <button class="download-btn" data-content="${escapedContent}" onclick="downloadHtml(this.getAttribute('data-content'))">Download HTML</button>
  `;
  
  container.appendChild(header);
  container.appendChild(preview);
  container.appendChild(fullCode);
  container.appendChild(actions);
  
  return container;
}

function toggleHtmlView(button) {
  const container = button.closest('.html-preview');
  const isExpanded = container.classList.contains('expanded');
  
  if (isExpanded) {
    container.classList.remove('expanded');
    button.textContent = 'View Full Code';
  } else {
    container.classList.add('expanded');
    button.textContent = 'Hide Full Code';
  }
}

function copyToClipboard(button, content) {
  // Unescape the content
  const unescapedContent = content.replace(/\\'/g, "'");
  
  navigator.clipboard.writeText(unescapedContent).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    button.textContent = 'Copy Failed';
    setTimeout(() => {
      button.textContent = 'Copy Code';
    }, 2000);
  });
}

function downloadHtml(content) {
  // Unescape the content
  const unescapedContent = content.replace(/\\'/g, "'");
  
  const blob = new Blob([unescapedContent], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'landing-page.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showTypingIndicator() {
  if (!chatMessages) return null;
  
  const typingEl = document.createElement('div');
  typingEl.className = 'message assistant';
  typingEl.innerHTML = `
    <div class="message-content">
      <div class="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  `;
  
  chatMessages.appendChild(typingEl);
  scrollToBottom();
  
  return typingEl;
}

function setProcessingState(processing) {
  isProcessing = processing;
  
  if (sendButton) {
    sendButton.disabled = processing;
  }
  
  if (messageInput) {
    messageInput.disabled = processing;
  }
}

function updateCharacterCount() {
  if (!messageInput || !charCount) return;
  
  const length = messageInput.value.length;
  const maxLength = 4000;
  
  charCount.textContent = length;
  
  if (length > maxLength * 0.9) {
    charCount.classList.add('warning');
  } else {
    charCount.classList.remove('warning');
  }
  
  if (length >= maxLength) {
    charCount.classList.add('error');
  } else {
    charCount.classList.remove('error');
  }
}

function autoResizeTextarea() {
  if (!messageInput) return;
  
  messageInput.style.height = 'auto';
  messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
}

function scrollToBottom() {
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

function saveColorScheme() {
  const primaryColor = document.getElementById('primaryInput')?.value || '#EC4899';
  const secondaryColor = document.getElementById('secondaryInput')?.value || '#64748B';
  const accentColor = document.getElementById('accentInput')?.value || '#F97316';
  
  // Update CSS custom properties
  document.documentElement.style.setProperty('--primary-color', primaryColor);
  document.documentElement.style.setProperty('--secondary-color', secondaryColor);
  document.documentElement.style.setProperty('--accent-color', accentColor);
  
  // Save to localStorage
  localStorage.setItem('orchid-colors', JSON.stringify({
    primary: primaryColor,
    secondary: secondaryColor,
    accent: accentColor
  }));
  
  // Show notification
  showNotification('Color scheme saved successfully!', 'success');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
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

async function loadDashboardMetrics() {
  try {
    const response = await fetch('/api/leads/statistics');
    const stats = await response.json();
    
    if (response.ok) {
      // Update dashboard metrics
      const leadsGenerated = document.getElementById('leads-generated');
      const leadsValidated = document.getElementById('leads-validated');
      const leadsContacted = document.getElementById('leads-contacted');
      const leadsConverted = document.getElementById('leads-converted');
      
      if (leadsGenerated) leadsGenerated.textContent = stats.total || 0;
      if (leadsValidated) leadsValidated.textContent = stats.validated || 0;
      if (leadsContacted) leadsContacted.textContent = stats.outreach_sent || 0;
      if (leadsConverted) leadsConverted.textContent = stats.converted || 0;
    }
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
  }
}

async function loadLeadsData() {
  try {
    // Build query parameters with current filters
    const params = new URLSearchParams({
      limit: '100',
      ...currentFilters
    });
    
    const response = await fetch(`/api/leads?${params}`);
    const data = await response.json();
    
    if (response.ok) {
      displayLeadsTable(data.leads || []);
      updateLeadsPagination(data);
    }
  } catch (error) {
    console.error('Failed to load leads data:', error);
  }
}

function displayLeadsTable(leads) {
  const tableBody = document.querySelector('.leads-table tbody');
  if (!tableBody) return;
  
  tableBody.innerHTML = '';
  
  if (leads.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #64748b;">
          No leads found. Ask AI Brenden to generate some leads for you!
        </td>
      </tr>
    `;
    return;
  }
  
  leads.forEach(lead => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <span class="source-badge ${getSourceClass(lead.source_platform)}">${lead.source_platform || 'Unknown'}</span>
      </td>
      <td>
        <div class="business-info">
          <strong>${lead.business_name}</strong>
          <small>${lead.category || lead.industry || 'Unknown Category'}</small>
        </div>
      </td>
      <td>
        <div class="contact-info">
          <strong>${lead.contact_name || 'No contact'}</strong>
          <small>${lead.role || ''}<br>${lead.email || ''}</small>
        </div>
      </td>
      <td>
        <div class="phone-info">
          <strong>${lead.phone_number || 'No phone'}</strong>
          ${lead.website ? `<br><small><a href="${lead.website}" target="_blank">Website</a></small>` : ''}
        </div>
      </td>
      <td>
        <div class="location-info">
          <strong>${lead.city || 'Unknown'}, ${lead.state || 'Unknown'}</strong>
          <small>${lead.address || ''}</small>
        </div>
      </td>
      <td>
        ${lead.rating ? `<span class="rating">${lead.rating}⭐</span>` : '<span class="no-rating">No rating</span>'}
      </td>
      <td>
        <span class="score ${getScoreClass(lead.average_score)}">${(lead.average_score || 0).toFixed(1)}</span>
      </td>
      <td>
        <span class="status ${getLeadStatus(lead)}">${getLeadStatusText(lead)}</span>
      </td>
      <td>
        <div class="action-buttons">
          <button class="btn secondary" onclick="viewLead('${lead.id}')">View</button>
          <button class="btn secondary" onclick="editLead('${lead.id}')">Edit</button>
        </div>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

function getSourceClass(source) {
  switch (source) {
    case 'LinkedIn': return 'linkedin';
    case 'Google Business': return 'google';
    case 'Yelp': return 'yelp';
    default: return 'unknown';
  }
}

function getScoreClass(score) {
  if (score >= 4) return 'high';
  if (score >= 2.5) return 'medium';
  return 'low';
}

function getLeadStatus(lead) {
  if (lead.converted) return 'converted';
  if (lead.response_received) return 'responded';
  if (lead.outreach_sent) return 'contacted';
  if (lead.validated) return 'qualified';
  return 'new';
}

function getLeadStatusText(lead) {
  if (lead.converted) return 'Converted';
  if (lead.response_received) return 'Responded';
  if (lead.outreach_sent) return 'Contacted';
  if (lead.validated) return 'Qualified';
  return 'New';
}

function updateLeadsPagination(data) {
  const paginationInfo = document.querySelector('.pagination-info');
  const pageNumbers = document.querySelector('.page-numbers');
  
  if (paginationInfo) {
    const start = ((data.page || 1) - 1) * (data.limit || 50) + 1;
    const end = Math.min(start + (data.leads?.length || 0) - 1, data.total || 0);
    paginationInfo.textContent = `Showing ${start}-${end} of ${data.total || 0} leads`;
  }
  
  if (pageNumbers) {
    pageNumbers.innerHTML = '';
    const totalPages = data.totalPages || 1;
    const currentPage = data.page || 1;
    
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
      const pageBtn = document.createElement('button');
      pageBtn.className = `page-btn ${i === currentPage ? 'active' : ''}`;
      pageBtn.textContent = i;
      pageBtn.onclick = () => loadLeadsPage(i);
      pageNumbers.appendChild(pageBtn);
    }
  }
}

async function loadLeadsPage(page) {
  try {
    const response = await fetch(`/api/leads?page=${page}&limit=50`);
    const data = await response.json();
    
    if (response.ok) {
      displayLeadsTable(data.leads || []);
      updateLeadsPagination(data);
    }
  } catch (error) {
    console.error('Failed to load leads page:', error);
  }
}

function viewLead(leadId) {
  // TODO: Implement lead detail view
  console.log('View lead:', leadId);
}

function editLead(leadId) {
  // TODO: Implement lead editing
  console.log('Edit lead:', leadId);
}

async function loadBranding() {
  try {
    const response = await fetch('/api/branding');
    if (response.ok) {
      const branding = await response.json();
      
      // Update sidebar logo
      if (branding.logo_url) {
        updateSidebarLogo(branding.logo_url);
        
        // Update logo preview in branding page
        const logoPreview = document.getElementById('logoPreview');
        if (logoPreview) {
          logoPreview.src = branding.logo_url;
          logoPreview.style.display = 'block';
        }
      }
      
      // Update colors
      if (branding.primary_color) {
        document.documentElement.style.setProperty('--primary-color', branding.primary_color);
      }
      if (branding.secondary_color) {
        document.documentElement.style.setProperty('--secondary-color', branding.secondary_color);
      }
      if (branding.accent_color) {
        document.documentElement.style.setProperty('--accent-color', branding.accent_color);
      }
    }
  } catch (error) {
    console.error('Failed to load branding:', error);
  }
  
  // Load employee profiles
  try {
    const response = await fetch('/api/branding/employee-profiles');
    if (response.ok) {
      const profiles = await response.json();
      
      profiles.forEach(profile => {
        if (profile.profile_picture_url && employees[profile.employee_id]) {
          employees[profile.employee_id].avatar = profile.profile_picture_url;
          updateEmployeeAvatars(profile.employee_id, profile.profile_picture_url);
        }
      });
    }
  } catch (error) {
    console.error('Failed to load employee profiles:', error);
  }
}

// Load saved color scheme on page load
document.addEventListener('DOMContentLoaded', function() {
  const savedColors = localStorage.getItem('orchid-colors');
  if (savedColors) {
    try {
      const colors = JSON.parse(savedColors);
      document.documentElement.style.setProperty('--primary-color', colors.primary);
      document.documentElement.style.setProperty('--secondary-color', colors.secondary);
      document.documentElement.style.setProperty('--accent-color', colors.accent);
      
      // Update form inputs
      const primaryInput = document.getElementById('primaryInput');
      const primaryPicker = document.getElementById('primaryPicker');
      const secondaryInput = document.getElementById('secondaryInput');
      const secondaryPicker = document.getElementById('secondaryPicker');
      const accentInput = document.getElementById('accentInput');
      const accentPicker = document.getElementById('accentPicker');
      
      if (primaryInput) primaryInput.value = colors.primary;
      if (primaryPicker) primaryPicker.value = colors.primary;
      if (secondaryInput) secondaryInput.value = colors.secondary;
      if (secondaryPicker) secondaryPicker.value = colors.secondary;
      if (accentInput) accentInput.value = colors.accent;
      if (accentPicker) accentPicker.value = colors.accent;
    } catch (error) {
      console.error('Failed to load saved colors:', error);
    }
  }
});