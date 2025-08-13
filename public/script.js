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
let sidebarCollapsed = false;

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
  sara: {
    id: 'sara',
    name: 'AI Sara',
    role: 'Blog Post Writer',
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
    console.log('🚀 Application initializing...');
    
    // Initialize processing states for all employees
    initializeProcessingStates();
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize UI state
    updateChatUIState();
    
    // Load initial data
    loadDashboardData();
    loadLeadsData();
    
    // Initialize sidebar functionality
    initializeSidebar();
    
    console.log('✅ Application initialized successfully');
});

/**
 * Initialize sidebar functionality
 */
function initializeSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (!sidebar) return;
    
    // Create sidebar toggle button if it doesn't exist
    if (!sidebarToggle) {
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '‹';
        toggleBtn.setAttribute('aria-label', 'Toggle sidebar');
        sidebar.appendChild(toggleBtn);
        
        // Add click event
        toggleBtn.addEventListener('click', toggleSidebar);
    } else {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Mobile menu toggle
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', toggleMobileSidebar);
    }
    
    // Load saved sidebar state
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        if (sidebarToggle) {
            sidebarToggle.innerHTML = '›';
        }
    }
    
    // Add tooltips to nav items for collapsed state
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        const text = item.querySelector('.nav-item-text');
        if (text) {
            item.setAttribute('data-tooltip', text.textContent.trim());
        }
    });
}

/**
 * Toggle sidebar collapsed state
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    
    if (!sidebar) return;
    
    const isCollapsed = sidebar.classList.toggle('collapsed');
    
    // Update toggle button icon
    if (sidebarToggle) {
        sidebarToggle.innerHTML = isCollapsed ? '›' : '‹';
    }
    
    // Save state
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    
    console.log(`Sidebar ${isCollapsed ? 'collapsed' : 'expanded'}`);
}

/**
 * Toggle mobile sidebar
 */
function toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    sidebar.classList.toggle('mobile-open');
    
    // Close sidebar when clicking outside on mobile
    if (sidebar.classList.contains('mobile-open')) {
        document.addEventListener('click', closeMobileSidebarOnOutsideClick);
    } else {
        document.removeEventListener('click', closeMobileSidebarOnOutsideClick);
    }
}

/**
 * Close mobile sidebar when clicking outside
 */
function closeMobileSidebarOnOutsideClick(event) {
    const sidebar = document.querySelector('.sidebar');
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    
    if (!sidebar || !sidebar.classList.contains('mobile-open')) return;
    
    // Don't close if clicking on sidebar or mobile menu toggle
    if (sidebar.contains(event.target) || 
        (mobileMenuToggle && mobileMenuToggle.contains(event.target))) {
        return;
    }
    
    sidebar.classList.remove('mobile-open');
    document.removeEventListener('click', closeMobileSidebarOnOutsideClick);
}

/**
 * Initialize processing states for all employees
 */
function initializeProcessingStates() {
    Object.keys(employees).forEach(employeeId => {
        pendingMessages[employeeId] = false;
        conversationThreads[employeeId] = null;
        conversationHistory[employeeId] = null;
    });
    console.log('✅ Processing states initialized for all employees');
}

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
      
      if (!clickedEmployeeId)