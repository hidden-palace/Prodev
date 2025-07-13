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
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Supabase service is not properly configured.'
      });
    }

    // Use upsert to ensure a row exists, then fetch it
    const { data: upsertData, error: upsertError } = await supabaseService.client
      .from('company_branding')
      .upsert({ 
        id: '00000000-0000-0000-0000-000000000001',
        logo_url: null,
        primary_color: '#ec4899',
        secondary_color: '#64748b',
        accent_color: '#f97316'
      }, { 
        onConflict: 'id',
        ignoreDuplicates: true 
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Error upserting branding:', upsertError);
      throw upsertError;
    }

    res.json(upsertData);
  } catch (err) {
    console.error('Failure in branding GET:', err);
    next(err);
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

    // Check if branding record exists
    const { data: existing } = await supabaseService.client
      .from('company_branding')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabaseService.client
        .from('company_branding')
        .update({ logo_url })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabaseService.client
        .from('company_branding')
        .insert({ logo_url })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('Logo saved successfully:', file_name);
    res.json({
      success: true,
      message: 'Logo saved successfully',
      branding: result
    });
  } catch (err) {
    console.error('Failure saving logo:', err);
    next(err);
  }
});

/**
 * GET /branding/employee-profiles - Get all employee profiles
 */
router.get('/employee-profiles', async (req, res, next) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Supabase service is not properly configured.'
      });
    }

    const { data, error } = await supabaseService.client
      .from('employee_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching employee profiles:', error);
      throw error;
    }

    res.json(data || []);
  } catch (err) {
    console.error('Failure in employee profiles GET:', err);
    next(err);
  }
});

/**
 * POST /branding/employee-profile - Save employee profile picture
 */
router.post('/employee-profile', async (req, res, next) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Supabase service is not properly configured.'
      });
    }

    const { employee_id, profile_picture_url, file_name } = req.body;

    if (!employee_id || !profile_picture_url) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'employee_id and profile_picture_url are required'
      });
    }

    // Check if profile exists
    const { data: existing } = await supabaseService.client
      .from('employee_profiles')
      .select('id')
      .eq('employee_id', employee_id)
      .single();

    let result;
    if (existing) {
      // Update existing profile
      const { data, error } = await supabaseService.client
        .from('employee_profiles')
        .update({ profile_picture_url })
        .eq('employee_id', employee_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabaseService.client
        .from('employee_profiles')
        .insert({ employee_id, profile_picture_url })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log(`Profile picture saved for employee ${employee_id}:`, file_name);
    res.json({
      success: true,
      message: 'Profile picture saved successfully',
      profile: result
    });
  } catch (err) {
    console.error('Failure saving employee profile:', err);
    next(err);
  }
});

/**
 * PUT /branding/colors - Update brand colors
 */
router.put('/colors', async (req, res, next) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Supabase service is not properly configured.'
      });
    }

    const { primary_color, secondary_color, accent_color } = req.body;

    // Check if branding record exists
    const { data: existing } = await supabaseService.client
      .from('company_branding')
      .select('id')
      .limit(1)
      .single();

    const updateData = {};
    if (primary_color) updateData.primary_color = primary_color;
    if (secondary_color) updateData.secondary_color = secondary_color;
    if (accent_color) updateData.accent_color = accent_color;

    let result;
    if (existing) {
      // Update existing record
      const { data, error } = await supabaseService.client
        .from('company_branding')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabaseService.client
        .from('company_branding')
        .insert(updateData)
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('Brand colors updated successfully');
    res.json({
      success: true,
      message: 'Brand colors updated successfully',
      branding: result
    });
  } catch (err) {
    console.error('Failure updating brand colors:', err);
    next(err);
  }
});

module.exports = router;