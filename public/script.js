// Global state
let currentEmployee = 'brenden';
let currentThreadId = null;
let isProcessing = {}; // Per-employee processing states
let conversationHistory = {}; // Store conversation history per employee
let isExportDropdownOpen = false; // Track export dropdown state

// Global state management
let activeEmployeeId = 'brenden';
let conversationThreads = {}; // Store separate thread IDs for each employee
let pendingMessages = {}; // Track pending messages per employee

// Employee configurations
const employees = {
  brenden: {
    id: 'brenden',
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
    id: 'van',
    name: 'AI Van',
    role: 'page operator',
    specialty: 'Digital Marketing Designer',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/logo_1754352839350.jpeg',
    description: 'Creative digital marketing specialist focused on landing page design and conversion optimization. I create compelling pages that turn visitors into customers.',
    quickActions: [
      { icon: '💼', text: 'Corporate services page', action: 'Design a landing page for corporate floral services' },
      { icon: '💒', text: 'Wedding packages page', action: 'Create a wedding floral packages landing page' },
      { icon: '📱', text: 'Mobile-first design', action: 'Design a mobile-optimized flower delivery page' }
    ],
    tags: ['Marketing', 'Design']
  },
     
  eden: {
      assistantId: 'asst_Lr3o67bwsM4LzhDef8bbsbCy',
      name: 'AI Eden',
      role: 'Email Occasion Reminder',
      specialty: 'Occasion Remminder AI',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/logo_1754352839350.jpeg',
    description: 'Send personalized email reminders on occasions to your customers to motivate them for keep coming again!.',
    quickActions: [
      { icon: '💼', text: 'Corporate services page', action: 'Design a landing page for corporate floral services' },
      { icon: '💒', text: 'Wedding packages page', action: 'Create a wedding floral packages landing page' },
      { icon: '📱', text: 'Mobile-first design', action: 'Design a mobile-optimized flower delivery page' }
    ],
    tags: ['Email Reminder', 'Email Expert']
  },
  sara: {
    id: 'sara',
    name: 'AI Sara',
    role: 'Blog Content Creator',
    specialty: 'Blog Post Expert',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/logo_1753134605371.png',
    description: 'Creative content marketing specialist focused on crafting engaging blog posts that build brand authority and convert readers into loyal customers. I deliver clear, impactful stories that drive results.',
    quickActions: [
  { icon: "✍️", text: "Flower care guides", action: "Write detailed blog posts on caring for orchids and luxury blooms" },
  { icon: "🌸", text: "Floral trends insights", action: "Create engaging articles on seasonal and design trends in floral arrangements" },
  { icon: "📈", text: "SEO-driven content", action: "Develop SEO-optimized blog posts to boost brand visibility and drive traffic" }
],
    tags: ['Blog Posts', 'Content Generation']
  },
  rey: {
    id: 'rey',
    name: 'AI Rey',
    role: 'Strategic Analyst',
    specialty: 'Lead Generation Plan Strategist',
    avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/angel.jpeg',
    description: 'I develop comprehensive lead generation strategies by analyzing competitor landscapes and market opportunities. I create data-driven plans that optimize conversion rates and identify the most promising prospects.',
    quickActions: [
      { icon: '🧲', text: 'Create Lead Generation Plan to get new Leads', action: 'Create Lead Generation Plan to get new Leads' },
      { icon: '📝', text: 'Generate a 3-Tier Lead Gen Strategy', action: 'Generate a 3-Tier Lead Gen Strategy' },
      { icon: '📊', text: 'Break Plan into Time-Phased Actions', action: 'Break Plan into Time-Phased Actions' },
      { icon: '🎯', text: 'Build KPI Tracking metrics', action: 'Build KPI Tracking metrics' }
    ],
    tags: ['Strategy', 'Analytics']
  },
  xavier: {
  id: 'xavier',
  name: 'AI Xavier',
  role: 'Content Specialist',
  specialty: 'Content Generation AI',
  avatar: 'https://cszzuotarqnwdiwrbaxu.supabase.co/storage/v1/object/public/logos/logo_1753134605371.png',
  description: 'I create compelling content across all formats – from engaging social media videos and UGC campaigns to persuasive email sequences and landing page copy. I understand audience psychology and craft messages that convert.',
  quickActions: [
    { icon: '🎥', text: 'Generate TikTok Video Concept', action: 'Generate TikTok Video Concept' },
    { icon: '📹', text: 'Create Instagram Reel Script', action: 'Create Instagram Reel Script' },
    { icon: '📝', text: 'Write UGC Video Caption', action: 'Write UGC Video Caption' },
    { icon: '💡', text: 'Suggest 5 UGC Ideas', action: 'Suggest 5 UGC Ideas for brand' }
  ],
  tags: ['Content', 'Marketing']
}
};

// Welcome messages
const welcomeMessages = {
  brenden: "👋 Hi! I'm AI Brenden, your Lead Research Specialist. I excel at finding and qualifying high-quality business leads. I can help you discover potential customers, research companies, and build targeted prospect lists. What kind of leads are you looking for today?",
  van: "👋 Hello! I'm AI Van, your Digital Marketing Designer. I specialize in creating high-converting landing pages and marketing automation workflows. I can help you design compelling pages, set up marketing funnels, and optimize your digital presence. What marketing project can I help you with?",
  rey: "👋 Hey there! I'm AI Rey, your Lead Generation Plan Strategist. I focus on voice outreach strategies and competitor analysis to help you understand your market better. I can help you develop outreach campaigns, analyze competitors, and create strategic plans. What's your lead generation goal?",
  xavier: "👋 Hi! I'm AI Xavier, your UGC Expert. I specialize in user-generated content strategies and content creation that resonates with your audience. I can help you develop content plans, create engaging copy, and build authentic brand connections. Ready to create some amazing content?"
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
      id: 'sara', 
      name: 'AI Sara', 
      role: 'Blog Post Writer', 
      specialty: 'Blog Post Expert',
      avatar: '/sara-avatar.jpg', 
      description: 'Creative content marketing specialist focused on crafting engaging blog posts that build brand authority and convert readers into loyal customers. I deliver clear, impactful stories that drive results.',
      status: 'online'
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
        console.error(`❌ DIRECT FETCH TEST: This means something is intercepting the response`);
        console.error(`❌ DIRECT FETCH TEST: Possible causes: Service Worker, WebContainer proxy, or routing issue`);
        return; // Exit early if HTML is received
      } else {
        console.log(`✅ DIRECT FETCH TEST: CLIENT RECEIVED VALID CSV DATA`);
        console.log(`✅ DIRECT FETCH TEST: CSV length: ${responseText.length} characters`);
      }
    } catch (directError) {
      console.error(`❌ EXPORT DEBUG: Direct fetch failed:`, directError);
      return; // Exit early if fetch fails
    }
    
    // Only proceed if we have valid responseText
    if (!responseText) {
      console.error(`❌ EXPORT DEBUG: No response text available for download`);
      return;
    }
    
    // Trigger download using the CSV data we fetched
    const blob = new Blob([responseText], { type: format === 'csv' ? 'text/csv' : 'application/xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leads_export_${new Date().toISOString().split('T')[0]}.${format}`;
    console.log(`💾 EXPORT DEBUG: Creating download link with blob data`);
    console.log(`💾 EXPORT DEBUG: Download filename:`, link.download);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success notification
    showNotification(`${format.toUpperCase()} export completed successfully!`, 'success');
    
  } catch (error) {
    console.error('Export error:', error);
    showNotification(`Export failed: ${error.message}`, 'error');
  } finally {
    // Hide loading state
    downloadBtn.classList.remove('loading');
    const btnText = downloadBtn.querySelector('.btn-text');
    const btnLoading = downloadBtn.querySelector('.btn-loading');
    if (btnText) btnText.style.display = 'flex';
    if (btnLoading) btnLoading.style.display = 'none';
    
    // Close dropdown
    isExportDropdownOpen = false;
    if (exportDropdown) exportDropdown.style.display = 'none';
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
  console.log('🔗 Reattaching event listeners for chat elements...');
  
  // Re-attach event listeners for HTML preview buttons using data-action attributes
  const actionButtons = chatMessages.querySelectorAll('[data-action]');
  actionButtons.forEach(btn => {
    const action = btn.getAttribute('data-action');
    const content = btn.getAttribute('data-content');
    
    // Remove any existing listeners to prevent duplicates
    btn.replaceWith(btn.cloneNode(true));
    const newBtn = chatMessages.querySelector(`[data-action="${action}"][data-content="${content}"]`) || 
                   chatMessages.querySelector(`[data-action="${action}"]`);
    
    if (newBtn) {
      switch (action) {
        case 'toggleHtmlView':
          newBtn.addEventListener('click', () => toggleHtmlView(newBtn));
          break;
        case 'copyToClipboard':
          if (content) {
            newBtn.addEventListener('click', () => copyToClipboard(newBtn, decodeURIComponent(content)));
          }
          break;
        case 'downloadHtml':
          if (content) {
            newBtn.addEventListener('click', () => downloadHtml(decodeURIComponent(content)));
          }
          break;
      }
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
  
  // Use profile picture URL if available, otherwise fall back to default avatar
  const avatarUrl = employee.profile_picture_url || employee.avatar;
  if (avatarImg) avatarImg.src = avatarUrl;
  
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
    const currentConfig = employeeConfig && employeeConfig[currentEmployee];
    
    if (!currentConfig || !currentConfig.assistantId) {
        console.error('Employee configuration not found for:', currentEmployee);
        displayMessage('System', 'Error: Employee configuration not available. Please refresh the page.', 'error');
        return;
    }
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
        
        // Check if leads were processed and refresh leads page if needed
        if (data.lead_processing && data.lead_processing.detected && data.lead_processing.processed) {
          console.log(`🎯 Leads detected and processed: ${data.lead_processing.count} leads`);
          
          // Show notification about lead processing
          showNotification(
            `${employees[currentEmployee]?.name} found and processed ${data.lead_processing.count} new leads!`,
            'success'
          );
          
        // Auto-refresh leads page if user is currently viewing it
const leadsSection = document.getElementById('leads-section');
if (leadsSection && leadsSection.classList.contains('active')) {
  console.log('📊 Auto-refreshing leads page...');
  await loadLeadsData({
    employee: currentEmployee,
    assistantId: currentConfig.assistantId
  });
}
          
          // Update dashboard metrics
          await loadDashboardMetrics();
        }
        
        console.log(`✅ Task completed for ${employees[currentEmployee]?.name}`);
        return;
      } else if (data.status === 'failed') {
        addMessage(`Task failed: ${data.error || 'Unknown error'}`, 'assistant', true);
        console.error(`❌ Task failed for ${employees[currentEmployee]?.name}:`, data.error);
        return;
      } else if (attempts >= maxAttempts) {
        addMessage('Analyzing the retrieved leads. Hang on a second...', 'assistant', true);
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
  
  // Create message avatar
  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  if (role === 'user') {
    avatar.textContent = 'U';
    avatar.title = 'You';
  } else {
    const emp = currentEmployee || 'brenden';
    avatar.textContent = emp.charAt(0).toUpperCase();
    avatar.title = currentEmployee ? getEmployeeName(emp) : 'AI Assistant';
  }

  // Create message bubble container
  const bubble = document.createElement('div');
  bubble.className = 'message-bubble';

  // Create message header
  const header = document.createElement('div');
  header.className = 'message-header';

  const sender = document.createElement('span');
  sender.className = 'message-sender';
  sender.textContent = role === 'user' ? 'You' : (currentEmployee ? getEmployeeName(currentEmployee) : 'AI Assistant');

  const timestamp = document.createElement('span');
  timestamp.className = 'message-time';
  timestamp.textContent = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  header.appendChild(sender);
  header.appendChild(timestamp);

  // Create message content with better formatting
  const messageContent = document.createElement('div');
  messageContent.className = 'message-content';
  
  // Format content with proper HTML rendering for AI responses
  if (role !== 'user' && typeof content === 'string') {
    // Convert basic markdown-like formatting to HTML
    let formattedContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    // Wrap in paragraphs if not already formatted
    if (!formattedContent.includes('<p>')) {
      formattedContent = '<p>' + formattedContent + '</p>';
    }
    
    messageContent.innerHTML = formattedContent;
  } else {
    messageContent.textContent = content;
  }

  // Handle special message types
  if (isError) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-message';
    
    const icon = document.createElement('div');
    icon.className = `status-icon error`;
    icon.textContent = '✕';
    
    statusDiv.appendChild(icon);
    statusDiv.appendChild(document.createTextNode(content));
    messageContent.innerHTML = '';
    messageContent.appendChild(statusDiv);
  }

  bubble.appendChild(header);
  bubble.appendChild(messageContent);

  messageEl.appendChild(avatar);
  messageEl.appendChild(bubble);
  
  chatMessages.appendChild(messageEl);
  scrollToBottom();
}

// Helper function to get employee display name
function getEmployeeName(employeeId) {
  const names = {
    'brenden': 'AI Brenden',
    'van': 'AI Van', 
    'Rey': 'AI Rey',
    'sara': 'AI Sara',
    'xavier': 'AI Xavier'
  };
  return names[employeeId] || 'AI Assistant';
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
  
  // Add appropriate icon based on type
  let icon = '';
  switch (type) {
    case 'success':
      icon = '✅';
      break;
    case 'error':
      icon = '❌';
      break;
    case 'warning':
      icon = '⚠️';
      break;
    default:
      icon = 'ℹ️';
  }
  
  notification.innerHTML = `
    <div class="notification-content">
      <span>${icon} ${message}</span>
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
  
  console.log(`📢 Notification shown: ${type} - ${message}`);
}

function updateLeadsPagination(data) {
  const paginationContainer = document.querySelector('.pagination-container');
  
  if (!paginationContainer) return;
  
  const { page = 1, totalPages = 1, total = 0, limit = 50 } = data;
  
  // Clear existing pagination
  paginationContainer.innerHTML = '';
  
  if (totalPages <= 1) {
    // Hide pagination if only one page or no data
    paginationContainer.style.display = 'none';
    return;
  }
  
  paginationContainer.style.display = 'flex';
  
  // Create pagination info
  const paginationInfo = document.createElement('div');
  paginationInfo.className = 'pagination-info';
  const startItem = ((page - 1) * limit) + 1;
  const endItem = Math.min(page * limit, total);
  paginationInfo.textContent = `Showing ${startItem}-${endItem} of ${total} leads`;
  
  // Create pagination controls
  const paginationControls = document.createElement('div');
  paginationControls.className = 'pagination-controls';
  
  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = page <= 1;
  prevBtn.onclick = () => {
    if (page > 1) {
      loadLeadsData(page - 1);
    }
  };
  
  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = page >= totalPages;
  nextBtn.onclick = () => {
    if (page < totalPages) {
      loadLeadsData(page + 1);
    }
  };
  
  // Page numbers (show current and nearby pages)
  const pageNumbers = document.createElement('div');
  pageNumbers.className = 'page-numbers';
  
  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === page ? 'active' : '';
    pageBtn.onclick = () => {
      if (i !== page) {
        loadLeadsData(i);
      }
    };
    pageNumbers.appendChild(pageBtn);
  }
  
  paginationControls.appendChild(prevBtn);
  paginationControls.appendChild(pageNumbers);
  paginationControls.appendChild(nextBtn);
  
  paginationContainer.appendChild(paginationInfo);
  paginationContainer.appendChild(paginationControls);
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize functions on page load
  loadDashboardMetrics();
  loadLeadsData();
  setupEventListeners();
});

function setupEventListeners() {
  // Example: Event listener for a download button
  const downloadBtn = document.getElementById('downloadLeadsBtn');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      // Assuming a default CSV export, you can add format selection later
      window.location.href = '/api/leads/export?format=csv';
      showNotification('Downloading leads data...', 'info');
    });
  }

  // Event listener for the "Ask AI" form
  const askForm = document.getElementById('ask-ai-form');
  if (askForm) {
    askForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const messageInput = document.getElementById('ai-message-input');
      const employeeSelect = document.getElementById('ai-employee-select');
      const message = messageInput.value;
      const employee = employeeSelect.value;

      if (!message || !employee) {
        showNotification('Please enter a message and select an AI employee.', 'warning');
        return;
      }

      showNotification(`Sending message to ${employee}...`, 'info');
      messageInput.value = ''; // Clear input

      try {
        const response = await fetch('/api/ask', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, employee }),
        });

        const result = await response.json();

        if (response.ok) {
          if (result.status === 'completed') {
            showNotification(`AI Response from ${result.employee.name}: ${result.message}`, 'success');
          } else if (result.status === 'requires_action') {
            showNotification(`AI Response from ${result.employee.name}: ${result.message}. Waiting for tool execution...`, 'warning');
            // You might want to poll for run status here or rely on webhook response
          }
        } else {
          showNotification(`Error from AI: ${result.error || 'Unknown error'}`, 'error');
          console.error('AI Ask Error:', result);
        }
      } catch (error) {
        showNotification('Failed to communicate with AI service.', 'error');
        console.error('AI Ask Fetch Error:', error);
      }
    });
  }

  // Event listener for the "Upload Logo" form
  const logoUploadForm = document.getElementById('logo-upload-form');
  if (logoUploadForm) {
    logoUploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const logoInput = document.getElementById('logo-file-input');
      const file = logoInput.files[0];

      if (!file) {
        showNotification('Please select a logo file to upload.', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append('logo', file);

      showNotification('Uploading logo...', 'info');

      try {
        const response = await fetch('/api/storage/logo', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          showNotification('Logo uploaded successfully!', 'success');
          // Optionally update the logo displayed on the page
          const companyLogoImg = document.getElementById('company-logo-img');
          if (companyLogoImg) {
            companyLogoImg.src = result.logo_url;
          }
        } else {
          showNotification(`Logo upload failed: ${result.details || result.error || 'Unknown error'}`, 'error');
          console.error('Logo Upload Error:', result);
        }
      } catch (error) {
        showNotification('Failed to upload logo.', 'error');
        console.error('Logo Upload Fetch Error:', error);
      }
    });
  }

  // Event listener for the "Upload Employee Avatar" form
  const avatarUploadForm = document.getElementById('avatar-upload-form');
  if (avatarUploadForm) {
    avatarUploadForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const avatarInput = document.getElementById('avatar-file-input');
      const employeeIdInput = document.getElementById('avatar-employee-id');
      const file = avatarInput.files[0];
      const employeeId = employeeIdInput.value;

      if (!file || !employeeId) {
        showNotification('Please select an avatar file and enter an employee ID.', 'warning');
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('employee_id', employeeId);

      showNotification(`Uploading avatar for ${employeeId}...`, 'info');

      try {
        const response = await fetch('/api/storage/employee-avatar', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (response.ok) {
          showNotification(`Avatar uploaded successfully for ${employeeId}!`, 'success');
          // Optionally update the avatar displayed on the page
          // You might need to refresh a specific employee profile section
        } else {
          showNotification(`Avatar upload failed: ${result.details || result.error || 'Unknown error'}`, 'error');
          console.error('Avatar Upload Error:', result);
        }
      } catch (error) {
        showNotification('Failed to upload avatar.', 'error');
        console.error('Avatar Upload Fetch Error:', error);
      }
    });
  }
}

/**
 * Displays a notification message to the user.
 * @param {string} message - The message to display.
 * @param {'success'|'error'|'info'|'warning'} type - The type of notification.
 */
function showNotification(message, type = 'info') {
  const notificationContainer = document.getElementById('notification-container');
  if (!notificationContainer) {
    console.warn('Notification container not found. Message:', message);
    return;
  }

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <div class="notification-message">${message}</div>
      <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;

  notificationContainer.appendChild(notification);

  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 5000);

  console.log(`📢 Notification shown: ${type} - ${message}`);
}

/**
 * Loads and displays dashboard metrics from the API.
 */
async function loadDashboardMetrics() {
  try {
    console.log('📈 Loading dashboard metrics...');
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

      console.log(`✅ Updated dashboard metrics: ${stats.total || 0} total leads`);
    } else {
      console.error('Failed to load dashboard metrics:', stats);
      showNotification('Failed to load dashboard metrics', 'error');
    }
  } catch (error) {
    console.error('Failed to load dashboard metrics:', error);
    showNotification('Error loading dashboard metrics', 'error');
  }
}

/**
 * Loads leads data from the API and updates the table and pagination.
 * @param {number} page - The page number to load.
 * @param {number} limit - The number of items per page.
 */
async function loadLeadsData(page = 1, limit = 10) {
  try {
    console.log(`📊 Loading leads data for page ${page} with limit ${limit}...`);
    const response = await fetch(`/api/leads?page=${page}&limit=${limit}`);
    const data = await response.json();

    if (response.ok) {
      displayLeadsTable(data.leads || []);
      updateLeadsPagination(data);
      console.log(`✅ Loaded ${data.leads?.length || 0} leads for page ${data.page}`);
    } else {
      console.error('Failed to load leads:', data);
      showNotification('Failed to load leads data', 'error');
    }
  } catch (error) {
    console.error('Failed to load leads data:', error);
    showNotification('Error loading leads data', 'error');
  }
}

/**
 * Displays leads in the table.
 * @param {Array} leads - An array of lead objects.
 */
function displayLeadsTable(leads) {
  const leadsTable = document.querySelector('.leads-table');
  const downloadBtn = document.getElementById('downloadLeadsBtn');

  if (!leadsTable) return;

  // Clear existing table content
  leadsTable.innerHTML = '';

  // Create table header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th>Source Platform</th>
      <th>Business</th>
      <th>Contact</th>
      <th>Location</th>
      <th>Score</th>
      <th>Status</th>
      <th>Actions</th>
    </tr>
  `;
  leadsTable.appendChild(thead);

  // Create table body
  const tableBody = document.createElement('tbody');

  if (leads.length === 0) {
    // Hide download button when no leads
    if (downloadBtn) {
      downloadBtn.style.display = 'none';
    }

    tableBody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 40px; color: #64748b;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 16px;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5;">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
            </svg>
            <div>
              <h4 style="margin: 0 0 8px 0; color: #374151;">No leads found yet</h4>
              <p style="margin: 0; font-size: 14px;">Leads generated by AI employees will appear here.</p>
            </div>
          </div>
        </td>
      </tr>
    `;
  } else {
    if (downloadBtn) {
      downloadBtn.style.display = 'inline-flex'; // Show button if leads exist
    }

    leads.forEach(lead => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${lead.source_platform || 'N/A'}</td>
        <td>${lead.business_name || 'N/A'}</td>
        <td>${lead.contact_name || 'N/A'}</td>
        <td>${lead.city || 'N/A'}, ${lead.state || 'N/A'}</td>
        <td>${(lead.average_score || 0).toFixed(1)}</td>
        <td><span class="status-badge status-${getLeadStatus(lead)}">${getLeadStatusText(lead)}</span></td>
        <td>
          <button class="action-btn view-btn" data-lead-id="${lead.id}">View</button>
          <button class="action-btn delete-btn" data-lead-id="${lead.id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }

  leadsTable.appendChild(tableBody);

  // Add event listeners for action buttons
  tableBody.querySelectorAll('.view-btn').forEach(button => {
    button.addEventListener('click', (event) => {
      const leadId = event.target.dataset.leadId;
      showNotification(`Viewing lead: ${leadId}`, 'info');
      // Implement detailed view logic here
    });
  });

  tableBody.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', async (event) => {
      const leadId = event.target.dataset.leadId;
      if (confirm(`Are you sure you want to delete lead ${leadId}?`)) {
        try {
          const response = await fetch(`/api/leads/${leadId}`, {
            method: 'DELETE',
          });
          if (response.ok) {
            showNotification(`Lead ${leadId} deleted successfully!`, 'success');
            loadLeadsData(); // Refresh the table
          } else {
            const errorData = await response.json();
            showNotification(`Failed to delete lead: ${errorData.details || errorData.error}`, 'error');
          }
        } catch (error) {
          showNotification('Error deleting lead.', 'error');
          console.error('Delete Lead Error:', error);
        }
      }
    });
  });
}

/**
 * Helper function to determine lead status.
 * @param {object} lead - The lead object.
 * @returns {string} - The status string (e.g., 'new', 'qualified', 'contacted', 'responded', 'converted').
 */
function getLeadStatus(lead) {
  if (lead.converted) return 'converted';
  if (lead.response_received) return 'responded';
  if (lead.outreach_sent) return 'contacted';
  if (lead.validated) return 'qualified';
  return 'new';
}

/**
 * Helper function to get human-readable lead status text.
 * @param {object} lead - The lead object.
 * @returns {string} - The human-readable status text.
 */
function getLeadStatusText(lead) {
  if (lead.converted) return 'Converted';
  if (lead.response_received) return 'Responded';
  if (lead.outreach_sent) return 'Contacted';
  if (lead.validated) return 'Qualified';
  return 'New';
}

/**
 * Updates the pagination controls based on the leads data.
 * @param {object} data - The pagination data from the API.
 */
function updateLeadsPagination(data) {
  const paginationContainer = document.getElementById('leads-pagination');
  if (!paginationContainer) return;

  const { page, totalPages, total, limit } = data;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    paginationContainer.style.display = 'none';
    return;
  }

  paginationContainer.style.display = 'flex';
  paginationContainer.innerHTML = ''; // Clear previous pagination

  // Pagination info (e.g., "Showing 1-10 of 100 leads")
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);
  const infoSpan = document.createElement('span');
  infoSpan.className = 'pagination-info';
  infoSpan.textContent = `Showing ${startItem}-${endItem} of ${total} leads`;
  paginationContainer.appendChild(infoSpan);

  const navDiv = document.createElement('div');
  navDiv.className = 'pagination-controls';

  // Previous button
  const prevBtn = document.createElement('button');
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = page === 1;
  prevBtn.addEventListener('click', () => loadLeadsData(page - 1, limit));
  navDiv.appendChild(prevBtn);

  // Page numbers
  const maxPageButtons = 5; // Max number of page buttons to show
  let startPage = Math.max(1, page - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

  if (endPage - startPage + 1 < maxPageButtons) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = i === page ? 'active' : '';
    pageBtn.addEventListener('click', () => loadLeadsData(i, limit));
    navDiv.appendChild(pageBtn);
  }

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.textContent = 'Next';
  nextBtn.disabled = page === totalPages;
  nextBtn.addEventListener('click', () => loadLeadsData(page + 1, limit));
  navDiv.appendChild(nextBtn);

  paginationContainer.appendChild(navDiv);
}

// Function to load company logo
async function loadCompanyLogo() {
  try {
    const response = await fetch('/api/branding');
    const brandingData = await response.json();
    const companyLogoImg = document.getElementById('company-logo-img');
    const logoIcon = document.querySelector('.logo-icon');

    if (companyLogoImg && logoIcon) {
      if (brandingData.logo_url) {
        companyLogoImg.src = brandingData.logo_url;
        companyLogoImg.style.display = 'block';
        logoIcon.style.display = 'none'; // Hide fallback
      } else {
        companyLogoImg.style.display = 'none';
        logoIcon.style.display = 'flex'; // Show fallback
      }
    }
  } catch (error) {
    console.error('Failed to load company logo:', error);
    const companyLogoImg = document.getElementById('company-logo-img');
    const logoIcon = document.querySelector('.logo-icon');
    if (companyLogoImg) companyLogoImg.style.display = 'none';
    if (logoIcon) logoIcon.style.display = 'flex'; // Ensure fallback is shown on error
  }
}

// Call loadCompanyLogo on page load
document.addEventListener('DOMContentLoaded', loadCompanyLogo);

// Function to load AI employee profiles for the dropdown
async function loadAIEmployees() {
  try {
    const response = await fetch('/api/branding/employee-profiles');
    const employees = await response.json();
    const employeeSelect = document.getElementById('ai-employee-select');

    if (employeeSelect) {
      employeeSelect.innerHTML = '<option value="">Select an AI Employee</option>'; // Default option
      employees.forEach(employee => {
        const option = document.createElement('option');
        option.value = employee.employee_id;
        option.textContent = employee.employee_id; // Or employee.name if available
        employeeSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Failed to load AI employees:', error);
    showNotification('Failed to load AI employee list.', 'error');
  }
}

// Call loadAIEmployees on page load
document.addEventListener('DOMContentLoaded', loadAIEmployees);

// Sidebar toggle functionality (if needed, based on your HTML structure)
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content-wrapper');

  if (sidebar && mainContent) {
    // Initial state (retracted) is handled by CSS
    // No JS needed for hover effect if purely CSS based

    // If you need a click-to-toggle functionality instead of hover,
    // you would add an event listener here to toggle a class on the sidebar.
    // For now, assuming CSS handles the hover expansion.
  }
});

// Example of how to use the showNotification function from other parts of your app
// showNotification('Welcome to Orchid Republic!', 'info');
            </div>
          </div>
        </td>
    `;
  } else {
    // Show download button when leads exist
    if (downloadBtn) {
      downloadBtn.style.display = 'inline-flex';
    }
    
    leads.forEach(lead => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${escapeHtml(lead.source_platform || 'Unknown')}</td>
        <td>
          <div style="font-weight: 500;">${escapeHtml(lead.business_name || 'Unknown Business')}</div>
          <div style="font-size: 12px; color: #64748b;">${escapeHtml(lead.industry || 'Unknown Industry')}</div>
        </td>
        <td>
          <div>${escapeHtml(lead.contact_name || 'No contact')}</div>
          <div style="font-size: 12px; color: #64748b;">${escapeHtml(lead.email || 'No email')}</div>
        </td>
        <td>${escapeHtml(lead.city || 'Unknown')}, ${escapeHtml(lead.state || 'Unknown')</td>
        <td>
          <span class="score-badge score-${getScoreClass(lead.score || 0)}">${lead.score || 0}</span>
        </td>
        <td>
          <span class="status-badge status-${getLeadStatus(lead)}">${getLeadStatusText(lead)}</span>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  
  leadsTable.appendChild(tableBody);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function getScoreClass(score) {
  if (score >= 4) return 'high';
  if (score >= 3) return 'medium';
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