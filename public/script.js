/**
 * Enhanced Orchid Republic Dashboard with Logo Upload and Sidebar Management
 */

// Global variables
let currentEmployee = 'brenden';
let currentLeadsData = [];
let currentPage = 1;
let totalPages = 1;
let currentFilters = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Orchid Republic Dashboard...');
    
    // Load initial branding and setup sidebar logo
    await loadBrandingData();
    
    // Load initial branding and setup sidebar logo
    await loadBrandingData();
    
    // Setup navigation
    setupNavigation();
    
    // Setup employee selection
    setupEmployeeSelection();
    
    // Load initial data
    await loadDashboardData();
    await loadLeadsData();
    
    // Setup event listeners
    setupEventListeners();
    
    console.log('✅ Dashboard initialization complete');
});

/**
 * Load branding data and setup sidebar logo
 */
async function loadBrandingData() {
    try {
        console.log('🎨 Loading branding data...');
        const response = await fetch('/api/branding');
        const branding = await response.json();
        
        console.log('🎨 Branding data loaded:', branding);
        
        // Update sidebar logo
        updateSidebarLogo(branding.logo_url);
        
        return branding;
    } catch (error) {
        console.error('❌ Error loading branding data:', error);
        updateSidebarLogo(null); // Show fallback
    }
}

/**
 * Update sidebar logo display
 */
function updateSidebarLogo(logoUrl) {
    const companyLogoContainer = document.querySelector('.company-logo');
    const logoImg = document.getElementById('company-logo-img');
    const logoIcon = document.querySelector('.logo-icon');
    
    if (!companyLogoContainer || !logoImg) {
        console.log('⚠️ Logo elements not found in DOM');
        return;
    }
    
    if (logoUrl && logoUrl.trim() !== '') {
        console.log('🖼️ Setting company logo:', logoUrl);
        logoImg.src = logoUrl;
        logoImg.onerror = function() {
            console.error('❌ Failed to load logo image:', logoUrl);
            // Fallback to text logo
            companyLogoContainer.classList.remove('has-logo');
        };
        logoImg.onload = function() {
            console.log('✅ Logo image loaded successfully');
            companyLogoContainer.classList.add('has-logo');
        };
    } else {
        console.log('📝 No logo URL provided, using text fallback');
        companyLogoContainer.classList.remove('has-logo');
        logoImg.src = '';
    }
}

/**
 * Load branding data and setup sidebar logo
 */
/**
 * Setup navigation between different sections
 */
function setupNavigation() {
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
            });
            
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
                
                // Load section-specific data
                switch(targetSection) {
                    case 'leads-section':
                        loadLeadsData();
                        break;
                    case 'branding-section':
                        loadBrandingSection();
                        break;
                    case 'dashboard-section':
                        loadDashboardData();
                        break;
                }
            }
        });
    });
}

/**
 * Setup employee selection functionality
 */
function setupEmployeeSelection() {
    const employeeItems = document.querySelectorAll('.team-member');
    
    employeeItems.forEach(item => {
        item.addEventListener('click', function() {
            const employeeId = this.dataset.employee;
            
            if (employeeId) {
                // Update active employee
                employeeItems.forEach(emp => emp.classList.remove('active'));
                this.classList.add('active');
                
                currentEmployee = employeeId;
                console.log('👤 Selected employee:', employeeId);
                
                // Reload data for selected employee
                loadLeadsData();
            }
        });
    });
}

/**
 * Setup event listeners for various UI elements
 */
function setupEventListeners() {
    // Logo upload in branding section
    setupLogoUpload();
    
    // Leads filtering
    setupLeadsFiltering();
    
    // Export functionality
    setupExportFunctionality();
}

/**
 * Setup logo upload functionality with 500x500px validation
 */
function setupLogoUpload() {
    const logoUpload = document.getElementById('logo-upload');
    const logoPreview = document.getElementById('logo-preview');
    const uploadBtn = document.getElementById('upload-logo-btn');
    const uploadStatus = document.getElementById('upload-status');
    
    if (!logoUpload) return;
    
    logoUpload.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        console.log('📤 Logo file selected:', file.name);
        
        try {
            // Validate file type
            const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
            if (!allowedTypes.includes(file.type)) {
                throw new Error('Invalid file type. Only PNG, JPEG, and SVG files are allowed.');
            }
            
            // Validate file size (2MB)
            if (file.size > 2 * 1024 * 1024) {
                throw new Error('File size must be less than 2MB.');
            }
            
            // For raster images, validate dimensions (500x500px)
            if (file.type !== 'image/svg+xml') {
                const dimensions = await validateImageDimensions(file);
                if (dimensions.width !== 500 || dimensions.height !== 500) {
                    throw new Error(`Logo must be exactly 500x500 pixels. Current size: ${dimensions.width}x${dimensions.height}px`);
                }
                console.log('✅ Image dimensions validated: 500x500px');
            }
            
            // Show preview
            if (logoPreview) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    logoPreview.innerHTML = `<img src="${e.target.result}" alt="Logo preview" style="max-width: 200px; max-height: 100px; border: 1px solid #ddd; border-radius: 4px;">`;
                };
                reader.readAsDataURL(file);
            }
            
            // Enable upload button
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload Logo';
            }
            
            // Show success status
            if (uploadStatus) {
                uploadStatus.innerHTML = '<span style="color: #10b981;">✅ File validated successfully. Click "Upload Logo" to proceed.</span>';
            }
            
        } catch (error) {
            console.error('❌ Logo validation failed:', error.message);
            
            // Show error status
            if (uploadStatus) {
                uploadStatus.innerHTML = `<span style="color: #ef4444;">❌ ${error.message}</span>`;
            }
            
            // Disable upload button
            if (uploadBtn) {
                uploadBtn.disabled = true;
                uploadBtn.textContent = 'Fix errors to upload';
            }
            
            // Clear preview
            if (logoPreview) {
                logoPreview.innerHTML = '';
            }
        }
    });
    
    // Upload button click
    if (uploadBtn) {
        uploadBtn.addEventListener('click', async function() {
            const file = logoUpload.files[0];
            if (!file) return;
            
            await uploadLogoFile(file);
        });
    }
}

/**
 * Validate image dimensions client-side
 */
function validateImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = function() {
            URL.revokeObjectURL(url);
            resolve({
                width: this.naturalWidth,
                height: this.naturalHeight
            });
        };
        
        img.onerror = function() {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for dimension validation'));
        };
        
        img.src = url;
    });
}

/**
 * Upload logo file to server
 */
async function uploadLogoFile(file) {
    const uploadBtn = document.getElementById('upload-logo-btn');
    const uploadStatus = document.getElementById('upload-status');
    
    try {
        // Show loading state
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="spinner" style="display: inline-block; width: 14px; height: 14px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>Uploading...';
        }
        
        if (uploadStatus) {
            uploadStatus.innerHTML = '<span style="color: #3b82f6;">🔄 Uploading logo...</span>';
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('logo', file);
        
        // Upload to server
        console.log('🚀 Uploading logo to server...');
        const response = await fetch('/api/storage/logo', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Logo uploaded successfully:', result.logo_url);
            
            // Update sidebar logo immediately
            updateSidebarLogo(result.logo_url);
            
            // Show success status
            if (uploadStatus) {
                uploadStatus.innerHTML = '<span style="color: #10b981;">✅ Logo uploaded successfully!</span>';
            }
            
            // Reset upload button
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload Logo';
            }
            
            // Clear file input
            document.getElementById('logo-upload').value = '';
            document.getElementById('logo-preview').innerHTML = '';
            
            // Show notification
            showNotification('Logo uploaded successfully!', 'success');
            
        } else {
            throw new Error(result.details || result.message || 'Upload failed');
        }
        
    } catch (error) {
        console.error('❌ Logo upload failed:', error);
        
        // Show error status
        if (uploadStatus) {
            uploadStatus.innerHTML = `<span style="color: #ef4444;">❌ Upload failed: ${error.message}</span>`;
        }
        
        // Reset upload button
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Logo';
        }
        
        // Show notification
        showNotification(`Upload failed: ${error.message}`, 'error');
    }
}

/**
 * Validate image dimensions client-side
 */
function validateImageDimensions(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        
        img.onload = function() {
            URL.revokeObjectURL(url);
            resolve({
                width: this.naturalWidth,
                height: this.naturalHeight
            });
        };
        
        img.onerror = function() {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to load image for dimension validation'));
        };
        
        img.src = url;
    });
}

/**
 * Upload logo file to server
 */
async function uploadLogoFile(file) {
    const uploadBtn = document.getElementById('upload-logo-btn');
    const uploadStatus = document.getElementById('upload-status');
    
    try {
        // Show loading state
        if (uploadBtn) {
            uploadBtn.disabled = true;
            uploadBtn.innerHTML = '<span class="spinner" style="display: inline-block; width: 14px; height: 14px; border: 2px solid #ffffff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>Uploading...';
        }
        
        if (uploadStatus) {
            uploadStatus.innerHTML = '<span style="color: #3b82f6;">🔄 Uploading logo...</span>';
        }
        
        // Create form data
        const formData = new FormData();
        formData.append('logo', file);
        
        // Upload to server
        console.log('🚀 Uploading logo to server...');
        const response = await fetch('/api/storage/logo', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Logo uploaded successfully:', result.logo_url);
            
            // Update sidebar logo immediately
            updateSidebarLogo(result.logo_url);
            
            // Show success status
            if (uploadStatus) {
                uploadStatus.innerHTML = '<span style="color: #10b981;">✅ Logo uploaded successfully!</span>';
            }
            
            // Reset upload button
            if (uploadBtn) {
                uploadBtn.disabled = false;
                uploadBtn.textContent = 'Upload Logo';
            }
            
            // Clear file input
            document.getElementById('logo-upload').value = '';
            document.getElementById('logo-preview').innerHTML = '';
            
            // Show notification
            showNotification('Logo uploaded successfully!', 'success');
            
        } else {
            throw new Error(result.details || result.message || 'Upload failed');
        }
        
    } catch (error) {
        console.error('❌ Logo upload failed:', error);
        
        // Show error status
        if (uploadStatus) {
            uploadStatus.innerHTML = `<span style="color: #ef4444;">❌ Upload failed: ${error.message}</span>`;
        }
        
        // Reset upload button
        if (uploadBtn) {
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Logo';
        }
        
        // Show notification
        showNotification(`Upload failed: ${error.message}`, 'error');
    }
}

/**
 * Load branding section data
 */
async function loadBrandingSection() {
    try {
        const branding = await loadBrandingData();
        
        // Update any branding-specific UI elements here
        console.log('🎨 Branding section loaded with data:', branding);
        
    } catch (error) {
        console.error('❌ Error loading branding section:', error);
    }
}

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        console.log('📊 Loading dashboard data...');
        
        // Load lead statistics
        const statsResponse = await fetch('/api/leads/statistics');
        const stats = await statsResponse.json();
        
        // Update dashboard metrics
        updateDashboardMetrics(stats);
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
    }
}

/**
 * Update dashboard metrics display
 */
function updateDashboardMetrics(stats) {
    // Update metric displays
    const totalLeadsEl = document.getElementById('total-leads');
    const validatedLeadsEl = document.getElementById('validated-leads');
    const contactedLeadsEl = document.getElementById('contacted-leads');
    const convertedLeadsEl = document.getElementById('converted-leads');
    
    if (totalLeadsEl) totalLeadsEl.textContent = stats.total || 0;
    if (validatedLeadsEl) validatedLeadsEl.textContent = stats.validated || 0;
    if (contactedLeadsEl) contactedLeadsEl.textContent = stats.outreach_sent || 0;
    if (convertedLeadsEl) convertedLeadsEl.textContent = stats.converted || 0;
}

/**
 * Load leads data with current filters
 */
async function loadLeadsData() {
    try {
        console.log('📋 Loading leads data for employee:', currentEmployee);
        
        // Build query parameters
        const params = new URLSearchParams({
            page: currentPage,
            limit: 50,
            employee_id: currentEmployee,
            ...currentFilters
        });
        
        const response = await fetch(`/api/leads?${params}`);
        const data = await response.json();
        
        currentLeadsData = data.leads || [];
        totalPages = data.totalPages || 1;
        
        // Update leads table
        updateLeadsTable(currentLeadsData);
        
        // Update pagination
        updatePagination(currentPage, totalPages, data.total);
        
        console.log(`✅ Loaded ${currentLeadsData.length} leads`);
        
    } catch (error) {
        console.error('❌ Error loading leads data:', error);
    }
}

/**
 * Update leads table display
 */
function updateLeadsTable(leads) {
    const tableBody = document.querySelector('#leads-table tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (leads.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 40px;">No leads found</td></tr>';
        return;
    }
    
    // Generate table rows
    leads.forEach(lead => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>
                <div class="business-info">
                    <strong>${escapeHtml(lead.business_name || 'Unknown Business')}</strong>
                    <small>${escapeHtml(lead.industry || 'Unknown Industry')}</small>
                </div>
            </td>
            <td>
                <div class="contact-info">
                    <strong>${escapeHtml(lead.contact_name || 'No Contact')}</strong>
                    <small>${escapeHtml(lead.email || 'No Email')}</small>
                    <small>${escapeHtml(lead.phone || 'No Phone')}</small>
                </div>
            </td>
            <td>${escapeHtml(lead.city || '')}, ${escapeHtml(lead.state || '')}</td>
            <td><span class="score ${getScoreClass(lead.score)}">${lead.score || 0}</span></td>
            <td><span class="status ${getLeadStatus(lead)}">${getLeadStatusText(lead)}</span></td>
            <td>${formatDate(lead.created_at)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon" onclick="editLead('${lead.id}')" title="Edit Lead">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon" onclick="deleteLead('${lead.id}')" title="Delete Lead">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c-1 0 2 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Get score CSS class based on score value
 */
function getScoreClass(score) {
    if (score >= 4) return 'high';
    if (score >= 2.5) return 'medium';
    return 'low';
}

/**
 * Get lead status based on lead properties
 */
function getLeadStatus(lead) {
    if (lead.converted) return 'converted';
    if (lead.response_received) return 'responded';
    if (lead.outreach_sent) return 'contacted';
    if (lead.validated) return 'qualified';
    return 'new';
}

/**
 * Get lead status display text
 */
function getLeadStatusText(lead) {
    if (lead.converted) return 'Converted';
    if (lead.response_received) return 'Responded';
    if (lead.outreach_sent) return 'Contacted';
    if (lead.validated) return 'Qualified';
    return 'New';
}

/**
 * Setup leads filtering functionality
 */
function setupLeadsFiltering() {
    const filterElements = document.querySelectorAll('.filter-select, .filter-input');
    
    filterElements.forEach(element => {
        element.addEventListener('change', function() {
            currentFilters[this.name] = this.value;
            currentPage = 1; // Reset to first page
            loadLeadsData();
        });
    });
}

/**
 * Setup export functionality
 */
function setupExportFunctionality() {
    const exportBtn = document.getElementById('export-leads-btn');
    if (!exportBtn) return;
    
    exportBtn.addEventListener('click', function() {
        const dropdown = document.getElementById('export-dropdown');
        if (dropdown) {
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        }
    });
    
    // Export CSV
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => exportLeads('csv'));
    }
    
    // Export XML
    const exportXmlBtn = document.getElementById('export-xml');
    if (exportXmlBtn) {
        exportXmlBtn.addEventListener('click', () => exportLeads('xml'));
    }
}

/**
 * Export leads in specified format
 */
async function exportLeads(format) {
    try {
        const params = new URLSearchParams({
            format: format,
            employee_id: currentEmployee,
            ...currentFilters
        });
        
        const response = await fetch(`/api/leads/export?${params}`);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `leads_export_${new Date().toISOString().split('T')[0]}.${format}`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showNotification(`Leads exported successfully as ${format.toUpperCase()}`, 'success');
        } else {
            throw new Error(`Export failed: ${response.statusText}`);
        }
        
    } catch (error) {
        console.error('❌ Export failed:', error);
        showNotification(`Export failed: ${error.message}`, 'error');
    }
}

/**
 * Update pagination controls
 */
function updatePagination(page, totalPages, totalItems) {
    const paginationInfo = document.querySelector('.pagination-info');
    const pageNumbers = document.querySelector('.page-numbers');
    
    if (paginationInfo) {
        const start = ((page - 1) * 50) + 1;
        const end = Math.min(page * 50, totalItems);
        paginationInfo.textContent = `Showing ${start}-${end} of ${totalItems} leads`;
    }
    
    if (pageNumbers) {
        pageNumbers.innerHTML = '';
        
        // Previous button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-btn';
        prevBtn.textContent = 'Previous';
        prevBtn.disabled = page <= 1;
        prevBtn.onclick = () => {
            if (page > 1) {
                currentPage = page - 1;
                loadLeadsData();
            }
        };
        pageNumbers.appendChild(prevBtn);
        
        // Page numbers
        const startPage = Math.max(1, page - 2);
        const endPage = Math.min(totalPages, page + 2);
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.className = `page-btn ${i === page ? 'active' : ''}`;
            pageBtn.textContent = i;
            pageBtn.onclick = () => {
                currentPage = i;
                loadLeadsData();
            };
            pageNumbers.appendChild(pageBtn);
        }
        
        // Next button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-btn';
        nextBtn.textContent = 'Next';
        nextBtn.disabled = page >= totalPages;
        nextBtn.onclick = () => {
            if (page < totalPages) {
                currentPage = page + 1;
                loadLeadsData();
            }
        };
        pageNumbers.appendChild(nextBtn);
    }
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
    
    // Create new notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-message">${icon} ${message}</div>
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
 * Utility functions
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    try {
        return new Date(dateString).toLocaleDateString();
    } catch (e) {
        return '';
    }
}

// Placeholder functions for lead management
function editLead(leadId) {
    console.log('Edit lead:', leadId);
    showNotification('Edit functionality coming soon', 'info');
}

function deleteLead(leadId) {
    if (confirm('Are you sure you want to delete this lead?')) {
        console.log('Delete lead:', leadId);
        showNotification('Delete functionality coming soon', 'info');
    }
}

// Add CSS for spinner animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);