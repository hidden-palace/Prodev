const SupabaseService = require('./supabase-client');

class LeadProcessor {
  constructor() {
    try {
      this.supabaseService = new SupabaseService();
    } catch (error) {
      console.warn('⚠️ LeadProcessor initialized without Supabase connection:', error.message);
      this.supabaseService = null;
    }
  }

  /**
   * Check if service is available
   */
  isAvailable() {
    return this.supabaseService && this.supabaseService.isConfigured;
  }

  /**
   * Process webhook response containing lead data
   */
  async processLeadData(webhookOutput, employeeId) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Lead processing service is not available. Please configure Supabase connection.');
      }
      
      console.log('🔍 Processing lead data from webhook output...');
      
      // Parse the JSON output from the webhook
      let leadsData;
      try {
        leadsData = JSON.parse(webhookOutput);
      } catch (parseError) {
        console.error('❌ Failed to parse webhook output as JSON:', parseError);
        throw new Error('Invalid JSON format in webhook response');
      }

      // Ensure we have an array of leads
      if (!Array.isArray(leadsData)) {
        console.error('❌ Webhook output is not an array:', typeof leadsData);
        throw new Error('Expected array of leads in webhook response');
      }

      if (leadsData.length === 0) {
        console.log('⚠️ No leads found in webhook response');
        return { success: true, leads: [], count: 0 };
      }

      console.log(`📊 Found ${leadsData.length} leads to process`);

      // Process and save leads to Supabase
      const savedLeads = await this.supabaseService.processAndSaveLeads(leadsData, employeeId);

      console.log(`✅ Successfully processed ${savedLeads.length} leads`);

      return {
        success: true,
        leads: savedLeads,
        count: savedLeads.length,
        message: `Successfully processed and saved ${savedLeads.length} leads`
      };

    } catch (err) {
      console.error('❌ Failure processing lead data:', err);
      throw err;
    }
  }

  /**
   * Check if webhook output contains lead data
   */
  isLeadData(webhookOutput) {
    try {
      const parsed = JSON.parse(webhookOutput);
      
      // Check if it's an array and contains lead-like objects
      if (Array.isArray(parsed) && parsed.length > 0) {
        const firstItem = parsed[0];
        
        // Check for common lead data fields
        const leadFields = ['title', 'business_name', 'address', 'phone', 'website', 'categories'];
        const hasLeadFields = leadFields.some(field => firstItem.hasOwnProperty(field));
        
        return hasLeadFields;
      }
      
      return false;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get lead statistics
   */
  async getStatistics() {
    if (!this.isAvailable()) {
      return {
        total: 0,
        validated: 0,
        outreach_sent: 0,
        responses: 0,
        converted: 0,
        error: 'Supabase not configured'
      };
    }
    return await this.supabaseService.getLeadStatistics();
  }

  /**
   * Get leads with filters
   */
  async getLeads(filters = {}, page = 1, limit = 50) {
    if (!this.isAvailable()) {
      return {
        leads: [],
        total: 0,
        page: 1,
        limit: 50,
        totalPages: 0,
        error: 'Supabase not configured'
      };
    }
    return await this.supabaseService.getLeads(filters, page, limit);
  }

  /**
   * Update lead
   */
  async updateLead(leadId, updates) {
    if (!this.isAvailable()) {
      throw new Error('Lead update service is not available. Please configure Supabase connection.');
    }
    return await this.supabaseService.updateLead(leadId, updates);
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId) {
    if (!this.isAvailable()) {
      throw new Error('Lead delete service is not available. Please configure Supabase connection.');
    }
    return await this.supabaseService.deleteLead(leadId);
  }

  /**
   * Export leads to CSV
   */
  async exportToCSV(leads) {
    if (!this.supabaseService) {
      throw new Error('Export service is not available. Please configure Supabase connection.');
    }
    return await this.supabaseService.exportToCSV(leads);
  }

  /**
   * Export leads to XML
   */
  async exportToXML(leads) {
    if (!this.supabaseService) {
      throw new Error('Export service is not available. Please configure Supabase connection.');
    }
    return await this.supabaseService.exportToXML(leads);
  }
}

module.exports = LeadProcessor;