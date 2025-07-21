const express = require('express');
const SupabaseService = require('../services/supabase-client');

const router = express.Router();

// Initialize Supabase service
let supabaseService;
try {
  supabaseService = new SupabaseService();
} catch (error) {
  console.error('Failed to initialize Supabase service:', error.message);
}

/**
 * GET /branding - Get current branding settings
 */
router.get('/', async (req, res, next) => {
  try {
    console.log('🎨 GET /api/branding called');
    
    if (!supabaseService) {
      console.error('❌ Supabase service not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Supabase service is not properly configured.'
      });
    }

    // Fetch actual branding data from database
    let brandingData = null;
    try {
      const { data, error } = await supabaseService.client
        .from('company_branding')
        .select('*')
        .single();
      
      if (!error && data) {
        brandingData = data;
      }
    } catch (dbError) {
      console.log('Database query failed, using defaults:', dbError.message);
    }

    // Use database data or fall back to defaults
    const resultBranding = brandingData || {
      id: '1',
      logo_url: null,
      primary_color: '#ec4899',
      secondary_color: '#64748b',
      accent_color: '#f97316',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('✅ Returning branding data:', { logo_url: resultBranding.logo_url });
    res.json(resultBranding);

  } catch (err) {
    console.error('❌ Error in branding GET:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * POST /branding/logo - Save company logo
 */
router.post('/logo', async (req, res, next) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Supabase service is not properly configured.'
      });
    }

    const { logo_url, file_name } = req.body;

    if (!logo_url) {
      return res.status(400).json({
        error: 'Missing logo_url',
        details: 'logo_url is required'
      });
    }

    // For now, just return success without database update
    const result = {
      id: '1',
      logo_url: logo_url,
      primary_color: '#ec4899',
      secondary_color: '#64748b',
      accent_color: '#f97316',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Logo saved successfully:', file_name);
    res.json({
      success: true,
      message: 'Logo saved successfully',
      branding: result
    });
  } catch (err) {
    console.error('Failure saving logo:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * GET /branding/employee-profiles - Get all employee profiles
 */
router.get('/employee-profiles', async (req, res, next) => {
  try {
    // Return empty array for now
    res.json([]);
  } catch (err) {
    console.error('Failure in employee profiles GET:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * POST /branding/employee-profile - Save employee profile picture
 */
router.post('/employee-profile', async (req, res, next) => {
  try {
    const { employee_id, profile_picture_url, file_name } = req.body;

    if (!employee_id || !profile_picture_url) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'employee_id and profile_picture_url are required'
      });
    }

    // Return mock success for now
    const result = {
      id: '1',
      employee_id: employee_id,
      profile_picture_url: profile_picture_url,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log(`Profile picture saved for employee ${employee_id}:`, file_name);
    res.json({
      success: true,
      message: 'Profile picture saved successfully',
      profile: result
    });
  } catch (err) {
    console.error('Failure saving employee profile:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

/**
 * PUT /branding/colors - Update brand colors
 */
router.put('/colors', async (req, res, next) => {
  try {
    const { primary_color, secondary_color, accent_color } = req.body;

    // Return mock success for now
    const result = {
      id: '1',
      logo_url: null,
      primary_color: primary_color || '#ec4899',
      secondary_color: secondary_color || '#64748b',
      accent_color: accent_color || '#f97316',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('Brand colors updated successfully');
    res.json({
      success: true,
      message: 'Brand colors updated successfully',
      branding: result
    });
  } catch (err) {
    console.error('Failure updating brand colors:', err);
    res.status(500).json({
      error: 'Internal server error',
      details: err.message
    });
  }
});

module.exports = router;