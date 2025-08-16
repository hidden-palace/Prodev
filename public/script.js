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