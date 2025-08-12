// Global state
let currentEmployee = 'brenden';
let currentThreadId = null;
let isProcessing = false;
let conversationHistory = {}; // Store conversation history per employee
let isExportDropdownOpen = false; // Track export dropdown state

// Global state management
let activeEmployeeId = 'brenden';
let conversationThreads = {}; // Store separate thread IDs for each employee
let pendingMessages = {}; // Track pending messages per employee

// Employee configurations
const employees = {
  brenden: {
    name: 'AI Brenden',
    role: 'lead scraper',
    specialty: 'Lead Research Specialist',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/brenden.jpeg',
    description: 'Expert data researcher specializing in B2B lead generation. I extract high-quality prospects from LinkedIn, Google Maps, and Yellow Pages with precision and attention to detail.',
    quickActions: [
      { icon: '🔍', text: 'Find florists in Los Angeles', action: 'Find florists in Los Angeles area' },
      { icon: '📊', text: 'Research wedding vendors', action: 'Research wedding vendors and event planners' },
      { icon: '🏢', text: 'Corporate clients search', action: 'Find corporate clients who need floral services' },
      { icon: '📋', text: 'Scrape LinkedIn For VAs', action: 'Scrape LinkedIn For Virtual Assistants' }
    ],
    tags: ['Specialist', 'Marketing']
  },
  van: {
    name: 'AI Van',
    role: 'page operator',
    specialty: 'Digital Marketing Designer',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/logo_1754352839350.jpeg',
    description: 'Creative digital marketing specialist focused on landing page design and conversion optimization. I create compelling pages that turn visitors into customers.',
    quickActions: [
      { icon: '🎨', text: 'Create Valentine\'s page', action: 'Create a Valentine\'s Day landing page for flower sales' },
      { icon: '💼', text: 'Corporate services page', action: 'Design a landing page for corporate floral services' },
      { icon: '💒', text: 'Wedding packages page', action: 'Create a wedding floral packages landing page' },
      { icon: '📱', text: 'Mobile-first design', action: 'Design a mobile-optimized flower delivery page' }
    ],
    tags: ['Marketing', 'Design']
  },
  Rey: {
    name: 'AI Rey',
    role: 'Strategic Analyst',
    specialty: 'Lead Generation Plan Strategist',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/angel.jpeg',
    description: 'I develop comprehensive lead generation strategies by analyzing competitor landscapes and market opportunities. I create data-driven plans that optimize conversion rates and identify the most promising prospects.',
    quickActions: [
      { icon: '🧲', text: 'Create Lead Generation Plan to get new Leads', action: 'Create Lead Generation Plan to get new Leads' },
      { icon: '📝', text: 'Generate a 3-Tier Lead Gen Strategy', action: 'Generate a 3-Tier Lead Gen Strategy' },
      { icon: '📊', text: 'Break Plan into Time-Phased Actions', action: 'Break Plan into Time-Phased Actions' },
      { icon: '🎯', text: ' Build KPI Tracking metrics', action: ' Build KPI Tracking metrics' }
    ],
    tags: ['Strategy', 'Analytics']
  },
  xavier: {
    name: 'AI Xavier',
    role: 'Content Specialist',
    specialty: 'Content Generation AI',
    description: 'I create compelling content across all formats - from engaging blog posts and social media content to persuasive email campaigns and landing page copy. I understand audience psychology and craft messages that convert.',
    avatar: '/api/branding/employee-avatars/xavier.jpg',
    tags: ['Content', 'Marketing'],
    tasks: [
      { id: 1, title: 'Create Email Campaign Content', status: 'in-progress' },
      { id: 2, title: 'Write Landing Page Copy', status: 'pending' },
      { id: 3, title: 'Develop Social Media Content', status: 'pending' }
    ]
  }
}; 

// DOM elements
let chatMessages, messageInput, sendButton, charCount, employeeList;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  initializeNavigation();
  initializeEmployeeSelection();
  initializeChatInterface();
  initializeBranding();
  initializeMobileMenu();
  initializeExportDropdown();
  
  // Load initial employee
  switchEmployee('brenden');
  
  // Load dashboard metrics
  loadDashboardMetrics();
  
  console.log('🚀 Orchid Republic Command Center initialized');
});

function initializeElements() {
  chatMessages = document.getElementById('chatMessages');
  messageInput = document.getElementById('messageInput');
  sendButton = document.getElementById('sendButton');
  charCount = document.getElementById('charCount');
  employeeList = document.querySelector('.team-members');
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
        console.log('🎯 Switching to leads section, loading data...');
        loadLeadsData();
      } else if (sectionId === 'dashboard') {
        console.log('🎯 Switching to dashboard section, loading metrics...');
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

function setupEmployeeProfiles() {
  console.log('🔧 Setting up employee profiles...');
  
  const employees = [
    { 
      id: 'brenden', 
      name: 'AI Brenden', 
      role: 'Lead Research Specialist', 
      specialty: 'Lead Generation & Data Research',
      avatar: '/brenden-avatar.jpg',
      description: 'Expert at finding and qualifying high-value leads through advanced research techniques.',
      status: 'online'
    },
    { 
      id: 'Van', 
      name: 'AI Van', 
      role: 'Landing Page Generation Expert', 
      specialty: 'Landing Page Expert',
      avatar: '/van-avatar.jpg',
      description: 'Expert at creating comprehensive engaging landing pages that convert.',
      status: 'online'
    },
    {
      id: 'Xavier',
      name: 'AI Xavier',
      role: 'UGC Expert', 
      avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop'
    },
    { 
      id: 'Rey', 
      name: 'AI Rey', 
      role: 'Lead Generation Plan Strategist', 
      specialty: 'Voice Outreach & Campaign Management',
      avatar: '/rey-avatar.jpg', 
      description: 'Specializes in creating effective outreach strategies and managing voice campaigns.',
      status: 'online'
    },
    { 
      id: 'Xavier', 
      name: 'AI Xavier', 
      role: 'Content Generation AI', 
      specialty: 'Expert UGC video generator',
      avatar: '/van-avatar.jpg',
      description: 'Expert at creating high quality AI UGC videos for Reels and Tiktok.',
      status: 'online'
    }
  ];

  // Clear existing employee list and ensure fresh state
  employeeList.innerHTML = '';
  
  console.log('🔧 CRITICAL: Creating employee elements with data attributes');

  employees.forEach((employee, index) => {
    const employeeEl = document.createElement('div');
    employeeEl.className = `team-member ${employee.id === activeEmployeeId ? 'active' : ''}`;
    // CRITICAL: Store employee ID in data attribute for foolproof identification
    employeeEl.setAttribute('data-employee-id', employee.id);
    employeeEl.setAttribute('data-employee-name', employee.name);
    employeeEl.innerHTML = `
      <div class="member-avatar">
        <img src="https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" alt="${employee.name}">
        <div class="status-indicator ${employee.status}"></div>
      </div>
      <div class="member-info">
        <div class="member-name">${employee.name}</div>
        <div class="member-role">${employee.role}</div>
        <div class="member-specialty">${employee.specialty}</div>
      </div>
    `;

    // CRITICAL: Add click handler using data attribute, not array index
    employeeEl.addEventListener('click', function() {
      const clickedEmployeeId = this.getAttribute('data-employee-id');
      const clickedEmployeeName = this.getAttribute('data-employee-name');
      
      console.log('🎯 EMERGENCY FIX: Employee clicked!');
      console.log('🎯 EMERGENCY FIX: Clicked element data-employee-id:', clickedEmployeeId);
      console.log('🎯 EMERGENCY FIX: Clicked element data-employee-name:', clickedEmployeeName);
      console.log('🎯 EMERGENCY FIX: Previous activeEmployeeId:', activeEmployeeId);
      
      if (!clickedEmployeeId) {
        console.error('🚨 CRITICAL ERROR: No employee ID found on clicked element!');
        return;
      }
      
      // Prevent processing if message is pending
      if (pendingMessages[clickedEmployeeId]) {
        console.warn('⚠️ Message pending, ignoring click');
        return;
      }
      
      // Update active employee with absolute certainty
      activeEmployeeId = clickedEmployeeId;
      
      console.log('🎯 EMERGENCY FIX: NEW activeEmployeeId set to:', activeEmployeeId);
      
      // Update visual selection
      document.querySelectorAll('.team-member').forEach(el => el.classList.remove('active'));
      this.classList.add('active');
      
      // Find employee data
      const selectedEmployee = employees.find(emp => emp.id === clickedEmployeeId);
      if (!selectedEmployee) {
        console.error('🚨 CRITICAL ERROR: Employee not found in array!');
        return;
      }
      
      console.log('🎯 EMERGENCY FIX: Selected employee object:', selectedEmployee);
      
      // Handle employee selection
      handleEmployeeClick(selectedEmployee);
    });

    employeeList.appendChild(employeeEl);
    
    console.log(`🔧 Employee ${employee.name} (${employee.id}) added to DOM with data attribute`);
  });

  console.log('✅ Employee profiles setup complete');
  console.log('✅ CRITICAL: activeEmployeeId is:', activeEmployeeId);
}

function handleEmployeeClick(employee) {
  console.log('👤 Employee selected:', employee.name, '(ID:', employee.id, ')');
  console.log('👤 CRITICAL VERIFICATION: activeEmployeeId is now:', activeEmployeeId);
  console.log('👤 CRITICAL VERIFICATION: employee.id is:', employee.id);
  console.log('👤 CRITICAL VERIFICATION: Do they match?', activeEmployeeId === employee.id);

  // Update active employee visual state
  document.querySelectorAll('.team-member').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-employee-id="${employee.id}"]`)?.classList.add('active');

  // Update chat header
  updateChatHeader(employee);

  // Load conversation for this employee
  loadConversationForEmployee(employee.id);

  console.log(`✅ Successfully switched to ${employee.name}`);
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
    
    // Add Enter key to send message
    messageInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        
        // Only send if there's content and not already processing
        if (messageInput.value.trim() && !isProcessing) {
          const chatForm = document.getElementById('chatForm');
          if (chatForm) {
            handleChatSubmit(event);
          }
        }
      }
    });
  }
}

function initializeBranding() {
  console.log('🎨 Initializing branding functionality...');
  
  const primaryPicker = document.getElementById('primaryPicker');
  const primaryInput = document.getElementById('primaryInput');
  const secondaryPicker = document.getElementById('secondaryPicker');
  const secondaryInput = document.getElementById('secondaryInput');
  const accentPicker = document.getElementById('accentPicker');
  const accentInput = document.getElementById('accentInput');
  const saveColorsBtn = document.getElementById('saveColorsBtn');
  const logoUpload = document.getElementById('logoUpload');
  
  console.log('🔍 Branding elements found:', {
    primaryPicker: !!primaryPicker,
    logoUpload: !!logoUpload,
    saveColorsBtn: !!saveColorsBtn
  });
  
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
  
  // Handle logo upload
  if (logoUpload) {
    console.log('✅ Logo upload input found, attaching event listener');
    logoUpload.addEventListener('change', handleLogoUpload);
  } else {
    console.error('❌ Logo upload input not found!');
  }
  
  // Load current branding on page load
  loadCurrentBranding();
}

async function handleLogoUpload(event) {
  console.log('🔍 FRONTEND DEBUG: handleLogoUpload called');
  
  const file = event.target.files[0];
  if (!file) return;
  
  console.log('🔍 FRONTEND DEBUG: Logo file selected:', {
    name: file.name,
    type: file.type,
    size: file.size
  });
  
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
  if (!allowedTypes.includes(file.type)) {
    showNotification('Invalid file type. Please select a PNG, JPG, or SVG file.', 'error');
    return;
  }
  
  // Validate file size (2MB)
  if (file.size > 2 * 1024 * 1024) {
    showNotification('File too large. Please select a file smaller than 2MB.', 'error');
    return;
  }
  
  try {
    console.log('🚀 FRONTEND DEBUG: Starting logo upload...');
    
    // Create FormData
    const formData = new FormData();
    formData.append('logo', file);
    
    console.log('📤 FRONTEND DEBUG: FormData created, making API call...');
    
    // Show loading notification
    showNotification('Uploading logo...', 'info');
    
    // Upload to server
    const response = await fetch('/api/storage/logo', {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 FRONTEND DEBUG: API response status:', response.status);
    console.log('📡 FRONTEND DEBUG: API response ok:', response.ok);
    
    const result = await response.json();
    console.log('📡 FRONTEND DEBUG: API response data:', result);
    
    if (response.ok && result.success) {
      showNotification('Logo uploaded successfully!', 'success');
      
      // Update logo preview
      updateLogoPreview(result.logo_url);
      
      // Clear file input
      event.target.value = '';
    } else {
      console.error('❌ FRONTEND DEBUG: Upload failed:', result);
      showNotification(`Upload failed: ${result.details || result.message || 'Unknown error'}`, 'error');
    }
    
  } catch (error) {
    console.error('❌ FRONTEND DEBUG: Upload error:', error);
    showNotification(`Upload error: ${error.message}`, 'error');
  }
}

async function loadCurrentBranding() {
  try {
    console.log('🔍 FRONTEND DEBUG: Loading current branding...');
    console.log('🔍 FRONTEND DEBUG: Loading current branding...');
    
    const response = await fetch('/api/branding');
    const branding = await response.json();
    
    console.log('📡 FRONTEND DEBUG: Current branding data:', branding);
    
    if (branding.logo_url) {
      updateLogoPreview(branding.logo_url);
    }
    
    // Update color inputs if they exist
    const primaryInput = document.getElementById('primaryInput');
    const primaryPicker = document.getElementById('primaryPicker');
    const secondaryInput = document.getElementById('secondaryInput');
    const secondaryPicker = document.getElementById('secondaryPicker');
    const accentInput = document.getElementById('accentInput');
    const accentPicker = document.getElementById('accentPicker');
    
    if (primaryInput && branding.primary_color) {
      primaryInput.value = branding.primary_color;
      if (primaryPicker) primaryPicker.value = branding.primary_color;
    }
    
    if (secondaryInput && branding.secondary_color) {
      secondaryInput.value = branding.secondary_color;
      if (secondaryPicker) secondaryPicker.value = branding.secondary_color;
    }
    
    if (accentInput && branding.accent_color) {
      accentInput.value = branding.accent_color;
      if (accentPicker) accentPicker.value = branding.accent_color;
    }
    
  } catch (error) {
    console.error('❌ FRONTEND DEBUG: Error loading branding:', error);
  }
}

function updateLogoPreview(logoUrl) {
  console.log('🖼️ FRONTEND DEBUG: Updating logo preview with URL:', logoUrl);
  
  const currentLogo = document.getElementById('currentLogo');
  const logoPreview = document.getElementById('logoPreview');
  
  if (currentLogo && logoPreview && logoUrl) {
    logoPreview.src = logoUrl;
    currentLogo.style.display = 'block';
    console.log('✅ FRONTEND DEBUG: Logo preview updated:', logoUrl);
  }
}

function removeLogo() {
  console.log('🗑️ FRONTEND DEBUG: Remove logo function called');
  // TODO: Implement logo removal
  console.log('🗑️ FRONTEND DEBUG: Remove logo requested');
  showNotification('Logo removal not implemented yet', 'warning');
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

function initializeExportDropdown() {
  const downloadBtn = document.getElementById('downloadLeadsBtn');
  const exportDropdown = document.getElementById('exportDropdown');
  
  if (!downloadBtn || !exportDropdown) return;
  
  // Toggle dropdown on button click
  downloadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    isExportDropdownOpen = !isExportDropdownOpen;
    exportDropdown.style.display = isExportDropdownOpen ? 'block' : 'none';
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (isExportDropdownOpen && 
        !downloadBtn.contains(e.target) && 
        !exportDropdown.contains(e.target)) {
      isExportDropdownOpen = false;
      exportDropdown.style.display = 'none';
    }
  });
  
  // Handle dropdown item clicks
  const dropdownItems = exportDropdown.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const format = item.getAttribute('data-format');
      if (format) {
        exportFilteredLeads(format);
      }
    });
  });
}

/**
 * Get current filter values from the leads page
 */
function getLeadsFilters() {
  const filters = {};
  
  // Get status filter and map to backend parameters
  const statusFilter = document.querySelector('.filter-select[data-filter="status"]');
  if (statusFilter && statusFilter.value && statusFilter.value !== 'All Leads') {
    switch (statusFilter.value) {
      case 'New':
        filters.validated = false;
        filters.outreach_sent = false;
        break;
      case 'Contacted':
        filters.outreach_sent = true;
        break;
      case 'Qualified':
        filters.validated = true;
        break;
    }
  }
  
  // Get industry filter
  const industryFilter = document.querySelector('.filter-select[data-filter="industry"]');
  if (industryFilter && industryFilter.value && industryFilter.value !== 'All Industries') {
    filters.industry = industryFilter.value;
  }
  
  // Get location filter
  const locationFilter = document.querySelector('.filter-input[data-filter="location"]');
  if (locationFilter && locationFilter.value.trim()) {
    filters.city = locationFilter.value.trim();
  }
  
  return filters;
}

/**
 * Export leads with current filters applied
 */
async function exportFilteredLeads(format) {
  const downloadBtn = document.getElementById('downloadLeadsBtn');
  const exportDropdown = document.getElementById('exportDropdown');
  
  if (!downloadBtn) return;
  
  try {
    // Show loading state
    downloadBtn.classList.add('loading');
    const btnText = downloadBtn.querySelector('.btn-text');
    const btnLoading = downloadBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'none';
    if (btnLoading) btnLoading.style.display = 'flex';
    
    // Get current filters
    const filters = getLeadsFilters();
    
    // Build query string
    const queryParams = new URLSearchParams();
    queryParams.append('format', format);
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value);
      }
    });
    
    // Add cache-busting parameter
    queryParams.append('_t', Date.now().toString());
    
    // Construct export URL
    const exportUrl = `/api/leads/export?${queryParams.toString()}`;
    
    console.log(`📥 Exporting leads as ${format.toUpperCase()} with filters:`, filters);
    console.log(`🔗 EXPORT DEBUG: Full export URL:`, exportUrl);
    console.log(`🌐 EXPORT DEBUG: Current window location:`, window.location.href);
    console.log(`🔗 EXPORT DEBUG: Absolute URL would be:`, new URL(exportUrl, window.location.origin).href);
    
    // Test if we can reach the server at all
    console.log(`🧪 EXPORT DEBUG: Testing server connectivity...`);
    try {
      const testResponse = await fetch('/api/test-route');
      const testData = await testResponse.json();
      console.log(`✅ EXPORT DEBUG: Server test successful:`, testData);
    } catch (testError) {
      console.error(`❌ EXPORT DEBUG: Server test failed:`, testError);
    }
    
    // Try to fetch the export URL directly to see what happens
    console.log(`🔍 DIRECT FETCH TEST: Attempting direct fetch to export URL (NO DOWNLOAD)...`);
    console.log(`🔍 DIRECT FETCH TEST: This is a test to see what the client receives from the server`);
    
    let responseText; // Declare responseText in outer scope
    try {
      const directResponse = await fetch(exportUrl);
      console.log(`📡 EXPORT DEBUG: Direct fetch response status:`, directResponse.status);
      console.log(`📡 EXPORT DEBUG: Direct fetch response headers:`, [...directResponse.headers.entries()]);
      console.log(`📡 EXPORT DEBUG: Direct fetch response type:`, directResponse.type);
      console.log(`📡 EXPORT DEBUG: Direct fetch response URL:`, directResponse.url);
      
      responseText = await directResponse.text(); // Assign to outer-scoped variable
      console.log(`📄 EXPORT DEBUG: Direct fetch response body (first 500 chars):`, responseText.substring(0, 500));
      
      // Check if it's HTML instead of CSV
      if (responseText.includes('<html') || responseText.includes('<!DOCTYPE')) {
        console.error(`❌ EXPORT DEBUG: Response is HTML, not CSV! This confirms the routing issue.`);
        console.error(`❌ DIRECT FETCH TEST: CLIENT RECEIVED HTML INSTEAD OF CSV`);
        console.error(`❌ DIRECT FETCH TEST: This means something is intercept