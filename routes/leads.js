const express = require('express');
const LeadProcessor = require('../services/lead-processor');

const router = express.Router();

// Initialize lead processor
let leadProcessor;
try {
  leadProcessor = new LeadProcessor();
} catch (error) {
  console.error('Failed to initialize lead processor:', error.message);
}

/**
 * GET /leads - Get leads with filtering and pagination
 */
router.get('/', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured. Please check Supabase connection.'
      });
    }

    const {
      source_platform,
      industry,
      city,
      validated,
      outreach_sent,
      employee_id,
      min_score,
      date_from,
      date_to,
      page = 1,
      limit = 50
    } = req.query;

    const filters = {};
    if (source_platform) filters.source_platform = source_platform;
    if (industry) filters.industry = industry;
    if (city) filters.city = city;
    if (validated !== undefined) filters.validated = validated === 'true';
    if (outreach_sent !== undefined) filters.outreach_sent = outreach_sent === 'true';
    if (employee_id) filters.employee_id = employee_id;
    if (min_score) filters.min_score = parseFloat(min_score);
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    const result = await leadProcessor.getLeads(
      filters,
      parseInt(page),
      parseInt(limit)
    );

    res.json(result);
  } catch (err) {
    console.error('Failure fetching leads:', err);
    next(err);
  }
});

/**
 * GET /leads/export - Export leads in CSV or XML format
 */
router.get('/export', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const {
      format = 'csv',
      source_platform,
      industry,
      city,
      validated,
      outreach_sent,
      employee_id,
      min_score,
      date_from,
      date_to
    } = req.query;

    // Validate format
    if (!['csv', 'xml'].includes(format.toLowerCase())) {
      return res.status(400).json({
        error: 'Invalid format',
        details: 'Format must be either csv or xml'
      });
    }

    const filters = {};
    if (source_platform) filters.source_platform = source_platform;
    if (industry) filters.industry = industry;
    if (city) filters.city = city;
    if (validated !== undefined) filters.validated = validated === 'true';
    if (outreach_sent !== undefined) filters.outreach_sent = outreach_sent === 'true';
    if (employee_id) filters.employee_id = employee_id;
    if (min_score) filters.min_score = parseFloat(min_score);
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    // Get all leads (no pagination for export)
    const result = await leadProcessor.getLeads(filters, 1, 10000);
    const leads = result.leads || [];

    if (format.toLowerCase() === 'csv') {
      const csv = await leadProcessor.exportToCSV(leads);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csv);
    } else if (format.toLowerCase() === 'xml') {
      const xml = await leadProcessor.exportToXML(leads);
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="leads_export_${new Date().toISOString().split('T')[0]}.xml"`);
      res.send(xml);
    }
  } catch (err) {
    console.error('Failure exporting leads:', err);
    next(err);
  }
});

/**
 * GET /leads/statistics - Get lead statistics
 */
router.get('/statistics', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const stats = await leadProcessor.getStatistics();
    res.json(stats);
  } catch (err) {
    console.error('Failure fetching lead statistics:', err);
    next(err);
  }
});

/**
 * PUT /leads/:id - Update lead
 */
router.put('/:id', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const { id } = req.params;
    const updates = req.body;

    // Validate updates
    const allowedFields = [
      'contact_name', 'role_title', 'email', 'phone', 'website',
      'validated', 'outreach_sent', 'response_received', 'converted',
      'relevance_score', 'contact_role_score', 'location_score',
      'completeness_score', 'online_presence_score'
    ];

    const filteredUpdates = {};
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    const updatedLead = await leadProcessor.updateLead(id, filteredUpdates);
    res.json(updatedLead);
  } catch (err) {
    console.error('Failure updating lead:', err);
    next(err);
  }
});

/**
 * DELETE /leads/:id - Delete lead
 */
router.delete('/:id', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const { id } = req.params;
    await leadProcessor.deleteLead(id);
    
    res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    console.error('Failure deleting lead:', err);
    next(err);
  }
});

/**
 * POST /leads/process - Manually process lead data
 */
router.post('/process', async (req, res, next) => {
  try {
    if (!leadProcessor) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Lead processor is not properly configured.'
      });
    }

    const { output, employee_id } = req.body;

    if (!output || !employee_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'output and employee_id are required'
      });
    }

    const result = await leadProcessor.processLeadData(output, employee_id);
    res.json(result);
  } catch (err) {
    console.error('Failure processing lead data:', err);
    next(err);
  }
});

module.exports = router;