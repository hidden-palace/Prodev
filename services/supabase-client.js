const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    console.log('🔧 SUPABASE DEBUG: Initializing SupabaseService...');
    console.log('🔧 SUPABASE DEBUG: Constructor called at:', new Date().toISOString());
    
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    console.log('🔧 SUPABASE DEBUG: Environment variables check:');
    console.log('   VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING');
    console.log('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'MISSING');
    console.log('🔧 SUPABASE DEBUG: URL type:', typeof supabaseUrl, 'Key type:', typeof supabaseKey);
    console.log('🔧 SUPABASE DEBUG: URL length:', supabaseUrl?.length || 0, 'Key length:', supabaseKey?.length || 0);
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ SUPABASE DEBUG: Missing environment variables!');
      console.error('❌ SUPABASE DEBUG: About to throw configuration error');
      throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
    }
    
    try {
      console.log('🔧 SUPABASE DEBUG: Creating Supabase client...');
      this.client = createClient(supabaseUrl, supabaseKey);
      console.log('✅ SUPABASE DEBUG: Supabase client created successfully');
      console.log('✅ SUPABASE DEBUG: Client object type:', typeof this.client);
      console.log('✅ SUPABASE DEBUG: Client has from method:', typeof this.client.from === 'function');
    } catch (initError) {
      console.error('❌ SUPABASE DEBUG: Failed to create Supabase client:', initError);
      console.error('❌ SUPABASE DEBUG: Init error type:', initError.constructor.name);
      console.error('❌ SUPABASE DEBUG: Init error message:', initError.message);
      throw new Error(`Failed to initialize Supabase client: ${initError.message}`);
    }
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

      const { data, error: insertError } = await this.client
        .from('public.leads')
        .insert(processedLeads)
        .select();

      if (insertError) {
        console.error('❌ Error saving leads to Supabase:', insertError);
        throw insertError;
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
      console.log('🔍 SUPABASE DEBUG: getLeads method called');
      console.log('🔍 SUPABASE DEBUG: Input parameters:', { filters, page, limit });
      console.log('🔍 SUPABASE DEBUG: Supabase client status:', !!this.client);
      
      // Test basic Supabase connection first
      console.log('🧪 SUPABASE DEBUG: Testing basic connection to leads table...');
      try {
        const { data: testData, error: testError } = await this.client
          .from('public.leads')
          .select('id')
          .limit(1);
        
        if (testError) {
          console.error('❌ SUPABASE DEBUG: Basic connection test failed:', testError);
          console.error('❌ SUPABASE DEBUG: Full testError object:', JSON.stringify(testError, null, 2));
          console.error('❌ SUPABASE DEBUG: testError type:', typeof testError);
          console.error('❌ SUPABASE DEBUG: testError constructor:', testError.constructor.name);
          console.error('❌ SUPABASE DEBUG: Error details:', {
            message: testError.message,
            details: testError.details,
            hint: testError.hint,
            code: testError.code
          });
          throw testError;
        }
        
        console.log('✅ SUPABASE DEBUG: Basic connection successful, sample data:', testData);
      } catch (connectionError) {
        console.error('❌ SUPABASE DEBUG: Connection test threw exception:', connectionError);
        console.error('❌ SUPABASE DEBUG: Full connectionError object:', JSON.stringify(connectionError, null, 2));
        console.error('❌ SUPABASE DEBUG: Exception type:', connectionError.constructor.name);
        console.error('❌ SUPABASE DEBUG: Exception message:', connectionError.message);
        if (connectionError.stack) {
          console.error('❌ SUPABASE DEBUG: Exception stack:', connectionError.stack);
        }
        throw connectionError;
      }
      
      // Use explicit column selection instead of select('*') to avoid potential issues
      const columns = [
        'id',
        'business_name',
        'contact_name',
        'role_title',
        'email',
        'phone',
        'website',
        'address',
        'city',
        'state',
        'postal_code',
        'country',
        'industry',
        'categories',
        'relevance_score',
        'contact_role_score',
        'location_score',
        'completeness_score',
        'online_presence_score',
        'validated',
        'outreach_sent',
        'response_received',
        'converted',
        'employee_id',
        'created_at',
        'updated_at'
      ].join(', ');
      
      console.log('🔍 SUPABASE DEBUG: Using explicit column selection:', columns);
      
      let query = this.client
        .from('public.leads')
        .select(columns);

      console.log('🔍 SUPABASE DEBUG: Base query created');

      // Apply filters
      if (filters.source_platform && filters.source_platform !== 'All Sources') {
        console.log('🔍 SUPABASE DEBUG: Applying source_platform filter:', filters.source_platform);
        query = query.eq('source_platform', filters.source_platform);
      }

      if (filters.industry && filters.industry !== 'All Industries') {
        console.log('🔍 SUPABASE DEBUG: Applying industry filter:', filters.industry);
        query = query.eq('industry', filters.industry);
      }

      if (filters.city) {
        console.log('🔍 SUPABASE DEBUG: Applying city filter:', filters.city);
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters.validated !== undefined) {
        console.log('🔍 SUPABASE DEBUG: Applying validated filter:', filters.validated);
        query = query.eq('validated', filters.validated);
      }

      if (filters.outreach_sent !== undefined) {
        console.log('🔍 SUPABASE DEBUG: Applying outreach_sent filter:', filters.outreach_sent);
        query = query.eq('outreach_sent', filters.outreach_sent);
      }

      if (filters.employee_id) {
        console.log('🔍 SUPABASE DEBUG: Applying employee_id filter:', filters.employee_id);
        query = query.eq('employee_id', filters.employee_id);
      }

      if (filters.min_score) {
        console.log('🔍 SUPABASE DEBUG: Applying min_score filter:', filters.min_score);
        query = query.gte('relevance_score', filters.min_score);
      }

      // Date range filtering
      if (filters.date_from) {
        console.log('🔍 SUPABASE DEBUG: Applying date_from filter:', filters.date_from);
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        console.log('🔍 SUPABASE DEBUG: Applying date_to filter:', filters.date_to);
        // Add one day to include the entire end date
        const endDate = new Date(filters.date_to);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString().split('T')[0]);
      }

      // Apply sorting
      const sortField = filters.sort || 'created_at';
      const sortOrder = filters.order === 'asc' ? true : false;
      
      console.log('🔍 SUPABASE DEBUG: Applying sort:', { sortField, sortOrder });
      query = query.order('created_at', { ascending: sortOrder });
      
      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      console.log('🔍 SUPABASE DEBUG: Applying pagination:', { from, to, page, limit });
      query = query.range(from, to);

      console.log('🚀 SUPABASE DEBUG: About to execute query...');
      console.log('🚀 SUPABASE DEBUG: About to execute final query...');
      const { data, error: supabaseError, count } = await query;
      console.log('✅ SUPABASE DEBUG: Query executed without throwing!');

      if (supabaseError) {
        console.error('❌ SUPABASE DEBUG: Query execution failed:', supabaseError);
        console.error('❌ SUPABASE DEBUG: Error details:', {
          message: supabaseError.message,
          details: supabaseError.details,
          hint: supabaseError.hint,
          code: supabaseError.code
        });
        throw supabaseError;
      }

      console.log('✅ SUPABASE DEBUG: Query executed successfully!');
      console.log('✅ SUPABASE DEBUG: Result summary:', {
        dataLength: data?.length || 0,
        count,
        hasData: !!data && data.length > 0
      });
      
      if (data && data.length > 0) {
        console.log('📋 SUPABASE DEBUG: First lead from DB:', {
          id: data[0].id,
          business_name: data[0].business_name,
          contact_name: data[0].contact_name,
          email: data[0].email,
          phone: data[0].phone,
          city: data[0].city,
          industry: data[0].industry,
          created_at: data[0].created_at
        });
        console.log('📋 SUPABASE DEBUG: Available columns in first lead:', Object.keys(data[0]));
      } else {
        console.log('⚠️ SUPABASE DEBUG: No data returned from query');
      }
      
      return {
        leads: data || [],
        total: count,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (err) {
      console.error('❌ SUPABASE DEBUG: Critical error in getLeads:', err);
      console.error('❌ SUPABASE DEBUG: Critical error timestamp:', new Date().toISOString());
      console.error('❌ SUPABASE DEBUG: Error type:', err.constructor.name);
      console.error('❌ SUPABASE DEBUG: Error message:', err.message);
      console.error('❌ SUPABASE DEBUG: Error stack trace:', err.stack);
      if (err.stack) {
        console.error('❌ SUPABASE DEBUG: Error stack:', err.stack);
      }
      console.error('❌ SUPABASE DEBUG: About to re-throw error from getLeads');
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
        this.escapeCsvField(lead.source_platform || 'Unknown'),
        this.escapeCsvField(lead.business_name || 'Unknown Business'),
        this.escapeCsvField(lead.contact_name || 'No Contact'),
        this.escapeCsvField(lead.role_title || lead.role || 'Unknown Role'),
        this.escapeCsvField(lead.email || 'No Email'),
        this.escapeCsvField(lead.phone || lead.phone_number || 'No Phone'),
        this.escapeCsvField(lead.address || 'No Address'),
        this.escapeCsvField(lead.city || 'Unknown City'),
        this.escapeCsvField(lead.state || 'Unknown State'),
        this.escapeCsvField(lead.postal_code || 'No Postal Code'),
        this.escapeCsvField(lead.country || 'Unknown Country'),
        this.escapeCsvField(lead.website || 'No Website'),
        this.escapeCsvField(lead.industry || lead.category || 'Unknown Industry'),
        this.escapeCsvField(Array.isArray(lead.categories) ? lead.categories.join('; ') : (lead.specialties || 'No Specialties')),
        lead.rating || '0',
        this.escapeCsvField(lead.profile_link || 'No Profile Link'),
        this.escapeCsvField(lead.notes || 'No Notes'),
        lead.relevance_score || '0',
        lead.contact_role_score || '0',
        lead.location_score || '0',
        lead.completeness_score || '0',
        lead.online_presence_score || '0',
        this.calculateAverageScore(lead),
        lead.validated ? 'Yes' : 'No',
        lead.outreach_sent ? 'Yes' : 'No',
        lead.response_received ? 'Yes' : 'No',
        lead.converted ? 'Yes' : 'No',
        this.escapeCsvField(lead.employee_id || 'Unknown Employee'),
        this.formatDate(lead.created_at)
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  /**
   * Calculate average score from individual scores
   */
  calculateAverageScore(lead) {
    const scores = [
      lead.relevance_score || 0,
      lead.contact_role_score || 0,
      lead.location_score || 0,
      lead.completeness_score || 0,
      lead.online_presence_score || 0
    ];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    return average.toFixed(1);
  }

  /**
   * Format date for CSV export
   */
  formatDate(dateString) {
    if (!dateString) return 'No Date';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    } catch (error) {
      return 'Invalid Date';
    }
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
    // Convert to string and handle null/undefined
    let stringField = field == null ? '' : String(field);
    
    // Remove any newlines and carriage returns that could break CSV format
    // TEMPORARILY COMMENTED OUT ALL FILTERS, SORTING, AND PAGINATION
    stringField = stringField.replace(/[\r\n]+/g, ' ').trim();
    // This is to test if the basic query works without any complexity
        throw statsError;
    console.log('🔍 SUPABASE DEBUG: Skipping all filters, sorting, and pagination for testing');
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
        .from('public.leads')
        .delete()
        .eq('id', leadId);
      total: data?.length || 0,
    // Return simplified result structure for testing
      page: 1,
      }
      limit: data?.length || 0,

      totalPages: 1
      console.log(`✅ Lead ${leadId} deleted successfully`);
      return true;
    } catch (err) {
      console.error('❌ Failure deleting lead:', err);
      throw err;
    }
  }
}

module.exports = SupabaseService;
