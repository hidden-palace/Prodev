const express = require('express');
const SupabaseService = require('../services/supabase-client');
const multer = require('multer');

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
    console.log('🎨 BRANDING DEBUG: GET /branding route called');
    
    if (!supabaseService) {
      console.error('❌ BRANDING DEBUG: Supabase service not initialized');
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Supabase service is not properly configured.'
      });
    }

    console.log('🔍 BRANDING DEBUG: Attempting to fetch existing branding record...');
    
    // First, try to get existing branding record
    const { data: existingData, error: selectError } = await supabaseService.client
      .from('company_branding')
      .select()
      .limit(1)
      .single();

    if (selectError && selectError.code !== 'PGRST116') {
      // PGRST116 is "no rows returned" - that's expected if no branding exists yet
      console.error('❌ BRANDING DEBUG: Error fetching branding:', selectError);
      throw selectError;
    }

    if (existingData) {
      console.log('✅ BRANDING DEBUG: Found existing branding record:', existingData);
      res.json(existingData);
    } else {
      console.log('📝 BRANDING DEBUG: No branding record found, creating default record...');
      
      // No record exists, create one with default values
      const { data: newData, error: insertError } = await supabaseService.client
        .from('company_branding')
        .insert({
          logo_url: null,
          primary_color: '#ec4899',
          secondary_color: '#64748b',
          accent_color: '#f97316'
        })
        .select()
        .single();

      if (insertError) {
        console.error('❌ BRANDING DEBUG: Error creating default branding record:', insertError);
        throw insertError;
      }

      console.log('✅ BRANDING DEBUG: Created default branding record:', newData);
      res.json(newData);
    }
  } catch (err) {
    console.error('❌ BRANDING DEBUG: Critical error in branding GET:', err);
    console.error('❌ BRANDING DEBUG: Error details:', {
      message: err.message,
      code: err.code,
      details: err.details,
      hint: err.hint
    });
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
      const { data, error: updateError } = await supabaseService.client
        .from('company_branding')
        .update({ logo_url })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) throw updateError;
      result = data;
    } else {
      // Create new record
      const { data, error: insertError } = await supabaseService.client
        .from('company_branding')
        .insert({ logo_url })
        .select()
        .single();

      if (insertError) throw insertError;
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

    const { data, error: supabaseError } = await supabaseService.client
      .from('employee_profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (supabaseError) {
      console.error('Error fetching employee profiles:', supabaseError);
      throw supabaseError;
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
      const { data, error: updateProfileError } = await supabaseService.client
        .from('employee_profiles')
        .update({ profile_picture_url })
        .eq('employee_id', employee_id)
        .select()
        .single();

      if (updateProfileError) throw updateProfileError;
      result = data;
    } else {
      // Create new profile
      const { data, error: insertProfileError } = await supabaseService.client
        .from('employee_profiles')
        .insert({ employee_id, profile_picture_url })
        .select()
        .single();

      if (insertProfileError) throw insertProfileError;
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
      const { data, error: updateColorsError } = await supabaseService.client
        .from('company_branding')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (updateColorsError) throw updateColorsError;
      result = data;
    } else {
      // Create new record
      const { data, error: insertColorsError } = await supabaseService.client
        .from('company_branding')
        .insert(updateData)
        .select()
        .single();

      if (insertColorsError) throw insertColorsError;
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

// Add the new routes for uploading logo and employee avatar

module.exports = router;