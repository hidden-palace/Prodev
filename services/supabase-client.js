const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
    
    this.client = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized');
  }

  /**
   * Calculate lead scores based on business data
   */
  calculateLeadScores(leadData) {
    const scores = {
      relevance_score: 0,
      contact_role_score: 0,
      location_score: 0,
      completeness_score: 0,
      online_presence_score: 0
    };

    // Relevance Score (1-5) - Based on business type and categories
    if (leadData.categories && Array.isArray(leadData.categories)) {
      const relevantCategories = ['florist', 'flower', 'wedding', 'event', 'gift', 'plant', 'nursery'];
      const matchingCategories = leadData.categories.filter(cat => 
        relevantCategories.some(rel => cat.toLowerCase().includes(rel))
      );
      scores.relevance_score = Math.min(5, Math.max(1, matchingCategories.length + 1));
    } else {
      scores.relevance_score = 3; // Default moderate relevance
    }

    // Contact Role Score (1-5) - Based on contact information quality
    if (leadData.contact_name && leadData.role_title) {
      const seniorRoles = ['owner', 'manager', 'director', 'ceo', 'president', 'founder'];
      const hasRole = seniorRoles.some(role => 
        leadData.role_title.toLowerCase().includes(role)
      );
      scores.contact_role_score = hasRole ? 5 : 3;
    } else if (leadData.contact_name) {
      scores.contact_role_score = 2;
    } else {
      scores.contact_role_score = 1;
    }

    // Location Score (1-5) - Based on location data completeness
    let locationPoints = 0;
    if (leadData.address) locationPoints++;
    if (leadData.city) locationPoints++;
    if (leadData.state) locationPoints++;
    if (leadData.postal_code) locationPoints++;
    if (leadData.country) locationPoints++;
    scores.location_score = Math.max(1, locationPoints);

    // Completeness Score (1-5) - Based on overall data completeness
    let completenessPoints = 0;
    if (leadData.business_name) completenessPoints++;
    if (leadData.phone) completenessPoints++;
    if (leadData.email) completenessPoints++;
    if (leadData.website) completenessPoints++;
    if (leadData.address) completenessPoints++;
    scores.completeness_score = Math.max(1, completenessPoints);

    // Online Presence Score (1-5) - Based on digital presence
    let onlinePoints = 0;
    if (leadData.website) onlinePoints += 2;
    if (leadData.email) onlinePoints++;
    if (leadData.totalScore && leadData.totalScore > 4) onlinePoints++;
    if (leadData.reviewsCount && leadData.reviewsCount > 10) onlinePoints++;
    scores.online_presence_score = Math.min(5, Math.max(1, onlinePoints));

    return scores;
  }

  /**
   * Process and save leads from AI agent response
   */
  async processAndSaveLeads(leadsData, employeeId) {
    try {
      console.log(`📊 Processing ${leadsData.length} leads from ${employeeId}`);
      
      const processedLeads = leadsData.map(lead => {
        const scores = this.calculateLeadScores(lead);
        
        return {
          business_name: lead.title || lead.business_name || 'Unknown Business',
          contact_name: lead.contact_name || null,
          role_title: lead.role_title || null,
          email: lead.email || null,
          phone: lead.phone || lead.phoneUnformatted || null,
          website: lead.website || null,
          address: lead.address || null,
          city: lead.city || null,
          state: lead.state || null,
          postal_code: lead.postalCode || lead.postal_code || null,
          country: lead.countryCode || lead.country || 'US',
          industry: lead.categoryName || 'Unknown',
          categories: lead.categories || [],
          ...scores,
          source_data: lead,
          employee_id: employeeId,
          validated: false,
          outreach_sent: false,
          response_received: false,
          converted: false
        };
      });

      const { data, error } = await this.client
        .from('leads')
        .insert(processedLeads)
        .select();

      if (error) {
        console.error('❌ Error saving leads to Supabase:', error);
        throw error;
      }

      console.log(`✅ Successfully saved ${data.length} leads to database`);
      return data;
    } catch (error) {
      console.error('❌ Error processing leads:', error);
      throw error;
    }
  }

  /**
   * Get leads with filtering and pagination
   */
  async getLeads(filters = {}, page = 1, limit = 50) {
    try {
      let query = this.client
        .from('leads')
        .select('*')
        .order('average_score', { ascending: false })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.industry && filters.industry !== 'All Industries') {
        query = query.eq('industry', filters.industry);
      }

      if (filters.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.validated !== undefined) {
        query = query.eq('validated', filters.validated);
      }

      if (filters.outreach_sent !== undefined) {
        query = query.eq('outreach_sent', filters.outreach_sent);
      }

      if (filters.employee_id) {
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters.min_score) {
        query = query.gte('average_score', filters.min_score);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Error fetching leads:', error);
        throw error;
      }

      return {
        leads: data || [],
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('❌ Error getting leads:', error);
      throw error;
    }
  }

  /**
   * Update lead status
   */
  async updateLead(leadId, updates) {
    try {
      const { data, error } = await this.client
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating lead:', error);
        throw error;
      }

      console.log(`✅ Lead ${leadId} updated successfully`);
      return data;
    } catch (error) {
      console.error('❌ Error updating lead:', error);
      throw error;
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStatistics() {
    try {
      const { data, error } = await this.client
        .from('leads')
        .select('average_score, validated, outreach_sent, response_received, converted, employee_id, created_at');

      if (error) {
        console.error('❌ Error fetching lead statistics:', error);
        throw error;
      }

      const stats = {
        total: data.length,
        validated: data.filter(l => l.validated).length,
        outreach_sent: data.filter(l => l.outreach_sent).length,
        responses: data.filter(l => l.response_received).length,
        converted: data.filter(l => l.converted).length,
        average_score: data.reduce((sum, l) => sum + (l.average_score || 0), 0) / data.length,
        by_employee: {},
        recent: data.filter(l => {
          const created = new Date(l.created_at);
          const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          return created > dayAgo;
        }).length
      };

      // Group by employee
      data.forEach(lead => {
        if (!stats.by_employee[lead.employee_id]) {
          stats.by_employee[lead.employee_id] = 0;
        }
        stats.by_employee[lead.employee_id]++;
      });

      return stats;
    } catch (error) {
      console.error('❌ Error getting lead statistics:', error);
      throw error;
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId) {
    try {
      const { error } = await this.client
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) {
        console.error('❌ Error deleting lead:', error);
        throw error;
      }

      console.log(`✅ Lead ${leadId} deleted successfully`);
      return true;
    } catch (error) {
      console.error('❌ Error deleting lead:', error);
      throw error;
    }
  }
}

module.exports = SupabaseService;