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

      const { data, error: supabaseError } = await this.client
        .from('leads')
        .insert(processedLeads)
        .select();

      if (supabaseError) {
        console.error('❌ Error saving leads to Supabase:', supabaseError);
        throw supabaseError;
      }

      console.log(`✅ Successfully saved ${data.length} leads to database`);
      return data;
    } catch (err) {
      console.error('❌ Failure processing leads:', err);
      throw err;
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
      if (filters.source_platform && filters.source_platform !== 'All Sources') {
        query = query.eq('source_platform', filters.source_platform);
      }

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

      // Date range filtering
      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.date_to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) {
        console.error('❌ Error fetching leads:', supabaseError);
        throw supabaseError;
      }

      return {
        leads: data || [],
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (err) {
      console.error('❌ Failure getting leads:', err);
      throw err;
    }
  }

  /**
   * Export leads to CSV format
   */
  async exportToCSV(leads) {
    const headers = [
      'Source Platform',
      'Business Name',
      'Contact Name',
      'Role',
      'Email',
      'Phone Number',
      'Address',
      'City',
      'State',
      'Postal Code',
      'Country',
      'Website',
      'Category',
      'Specialties',
      'Rating',
      'Profile Link',
      'Notes',
      'Relevance Score',
      'Contact Role Score',
      'Location Score',
      'Completeness Score',
      'Online Presence Score',
      'Average Score',
      'Validated',
      'Outreach Sent',
      'Response Received',
      'Converted',
      'Employee ID',
      'Created At'
    ];

    const csvRows = [headers.join(',')];

    leads.forEach(lead => {
      const row = [
        this.escapeCsvField(lead.source_platform || ''),
        this.escapeCsvField(lead.business_name || ''),
        this.escapeCsvField(lead.contact_name || ''),
        this.escapeCsvField(lead.role || lead.role_title || ''),
        this.escapeCsvField(lead.email || ''),
        this.escapeCsvField(lead.phone_number || lead.phone || ''),
        this.escapeCsvField(lead.address || ''),
        this.escapeCsvField(lead.city || ''),
        this.escapeCsvField(lead.state || ''),
        this.escapeCsvField(lead.postal_code || ''),
        this.escapeCsvField(lead.country || ''),
        this.escapeCsvField(lead.website || ''),
        this.escapeCsvField(lead.category || lead.industry || ''),
        this.escapeCsvField(Array.isArray(lead.specialties) ? lead.specialties.join('; ') : ''),
        lead.rating || '',
        this.escapeCsvField(lead.profile_link || ''),
        this.escapeCsvField(lead.notes || ''),
        lead.relevance_score || '',
        lead.contact_role_score || '',
        lead.location_score || '',
        lead.completeness_score || '',
        lead.online_presence_score || '',
        lead.average_score || '',
        lead.validated ? 'Yes' : 'No',
        lead.outreach_sent ? 'Yes' : 'No',
        lead.response_received ? 'Yes' : 'No',
        lead.converted ? 'Yes' : 'No',
        this.escapeCsvField(lead.employee_id || ''),
        lead.created_at || ''
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Export leads to XML format
   */
  async exportToXML(leads) {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<leads>\n';

    leads.forEach(lead => {
      xml += '  <lead>\n';
      xml += `    <source_platform>${this.escapeXml(lead.source_platform || '')}</source_platform>\n`;
      xml += `    <business_name>${this.escapeXml(lead.business_name || '')}</business_name>\n`;
      xml += `    <contact_name>${this.escapeXml(lead.contact_name || '')}</contact_name>\n`;
      xml += `    <role>${this.escapeXml(lead.role || lead.role_title || '')}</role>\n`;
      xml += `    <email>${this.escapeXml(lead.email || '')}</email>\n`;
      xml += `    <phone_number>${this.escapeXml(lead.phone_number || lead.phone || '')}</phone_number>\n`;
      xml += `    <address>${this.escapeXml(lead.address || '')}</address>\n`;
      xml += `    <city>${this.escapeXml(lead.city || '')}</city>\n`;
      xml += `    <state>${this.escapeXml(lead.state || '')}</state>\n`;
      xml += `    <postal_code>${this.escapeXml(lead.postal_code || '')}</postal_code>\n`;
      xml += `    <country>${this.escapeXml(lead.country || '')}</country>\n`;
      xml += `    <website>${this.escapeXml(lead.website || '')}</website>\n`;
      xml += `    <category>${this.escapeXml(lead.category || lead.industry || '')}</category>\n`;
      xml += `    <specialties>${this.escapeXml(Array.isArray(lead.specialties) ? lead.specialties.join('; ') : '')}</specialties>\n`;
      xml += `    <rating>${lead.rating || ''}</rating>\n`;
      xml += `    <profile_link>${this.escapeXml(lead.profile_link || '')}</profile_link>\n`;
      xml += `    <notes>${this.escapeXml(lead.notes || '')}</notes>\n`;
      xml += `    <relevance_score>${lead.relevance_score || ''}</relevance_score>\n`;
      xml += `    <contact_role_score>${lead.contact_role_score || ''}</contact_role_score>\n`;
      xml += `    <location_score>${lead.location_score || ''}</location_score>\n`;
      xml += `    <completeness_score>${lead.completeness_score || ''}</completeness_score>\n`;
      xml += `    <online_presence_score>${lead.online_presence_score || ''}</online_presence_score>\n`;
      xml += `    <average_score>${lead.average_score || ''}</average_score>\n`;
      xml += `    <validated>${lead.validated ? 'true' : 'false'}</validated>\n`;
      xml += `    <outreach_sent>${lead.outreach_sent ? 'true' : 'false'}</outreach_sent>\n`;
      xml += `    <response_received>${lead.response_received ? 'true' : 'false'}</response_received>\n`;
      xml += `    <converted>${lead.converted ? 'true' : 'false'}</converted>\n`;
      xml += `    <employee_id>${this.escapeXml(lead.employee_id || '')}</employee_id>\n`;
      xml += `    <created_at>${lead.created_at || ''}</created_at>\n`;
      xml += '  </lead>\n';
    });

    xml += '</leads>';
    return xml;
  }

  /**
   * Escape CSV field
   */
  escapeCsvField(field) {
    if (typeof field !== 'string') {
      field = String(field);
    }
    
    // If field contains comma, quote, or newline, wrap in quotes and escape quotes
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return '"' + field.replace(/"/g, '""') + '"';
    }
    return field;
  }

  /**
   * Escape XML content
   */
  escapeXml(text) {
    if (typeof text !== 'string') {
      text = String(text);
    }
    
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Update lead status
   */
  async updateLead(leadId, updates) {
    try {
      const { data, error: updateLeadError } = await this.client
        .from('leads')
        .update(updates)
        .eq('id', leadId)
        .select()
        .single();

      if (updateLeadError) {
        console.error('❌ Error updating lead:', updateLeadError);
        throw updateLeadError;
      }

      console.log(`✅ Lead ${leadId} updated successfully`);
      return data;
    } catch (err) {
      console.error('❌ Failure updating lead:', err);
      throw err;
    }
  }

  /**
   * Get lead statistics
   */
  async getLeadStatistics() {
    try {
      const { data, error: statsError } = await this.client
        .from('leads')
        .select('average_score, validated, outreach_sent, response_received, converted, employee_id, created_at');

      if (statsError) {
        console.error('❌ Error fetching lead statistics:', statsError);
        throw statsError;
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
    } catch (err) {
      console.error('❌ Failure getting lead statistics:', err);
      throw err;
    }
  }

  /**
   * Delete lead
   */
  async deleteLead(leadId) {
    try {
      const { error: deleteLeadError } = await this.client
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (deleteLeadError) {
        console.error('❌ Error deleting lead:', deleteLeadError);
        throw deleteLeadError;
      }

      console.log(`✅ Lead ${leadId} deleted successfully`);
      return true;
    } catch (err) {
      console.error('❌ Failure deleting lead:', err);
      throw err;
    }
  }
}

module.exports = SupabaseService;