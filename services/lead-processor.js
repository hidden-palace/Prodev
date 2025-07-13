const SupabaseService = require('./supabase-client');

class LeadProcessor {
  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Process webhook response containing lead data
   */
  async processLeadData(webhookOutput, employeeId) {
    try {
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
    return await this.supabaseService.getLeadStatistics();
  }

  /**
   * Get leads with filters
   */
  async getLeads(filters = {}, page = 1, limit = 50) {
    return await this.supabaseService.getLeads(filters, page, limit);
  }

  /**
   * Update lead
   */
  async updateLead(leadId, updates) {
    return await this.supabaseService.updateLead(leadId, updates);
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId) {
    return await this.supabaseService.deleteLead(leadId);
  }

  /**
   * Export leads to CSV
   */
  async exportToCSV(leads) {
    return await this.supabaseService.exportToCSV(leads);
  }

  /**
   * Export leads to XML
   */
  async exportToXML(leads) {
    return await this.supabaseService.exportToXML(leads);
  }
}

module.exports = LeadProcessor;