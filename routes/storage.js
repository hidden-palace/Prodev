const express = require('express');
const multer = require('multer');
const StorageService = require('../services/storage-service');
const SupabaseService = require('../services/supabase-client');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG, JPG, and SVG files are allowed.'));
    }
  }
});

// Initialize services
let storageService;
let supabaseService;

try {
  storageService = new StorageService();
  supabaseService = new SupabaseService();
} catch (error) {
  console.error('Failed to initialize storage services:', error.message);
}

/**
 * POST /storage/logo - Upload company logo
 */
router.post('/logo', upload.single('logo'), async (req, res, next) => {
  try {
    if (!storageService || !supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Storage services are not properly configured.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        details: 'Please select a logo file to upload.'
      });
    }

    console.log('📤 Processing logo upload:', {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to storage
    const uploadResult = await storageService.uploadLogo(req.file, req.file.originalname);

    // Update database with new logo URL
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
        .update({ logo_url: uploadResult.url })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new record
      const { data, error } = await supabaseService.client
        .from('company_branding')
        .insert({ logo_url: uploadResult.url })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('✅ Logo upload completed successfully');
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: uploadResult.url,
      branding: result
    });

  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    
    // Enhanced error response for debugging
    const errorResponse = {
      error: 'Logo upload failed',
      details: error.message,
      context: {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(500).json(errorResponse);
  }
});

/**
 * POST /storage/employee-avatar - Upload employee avatar
 */
router.post('/employee-avatar', upload.single('avatar'), async (req, res, next) => {
  try {
    if (!storageService || !supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Storage services are not properly configured.'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        details: 'Please select an avatar file to upload.'
      });
    }

    const { employee_id } = req.body;
    if (!employee_id) {
      return res.status(400).json({
        error: 'Missing employee_id',
        details: 'Employee ID is required for avatar upload.'
      });
    }

    console.log('📤 Processing avatar upload for employee:', employee_id, {
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to storage
    const uploadResult = await storageService.uploadEmployeeAvatar(req.file, employee_id);

    // Update database with new avatar URL
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
        .update({ profile_picture_url: uploadResult.url })
        .eq('employee_id', employee_id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabaseService.client
        .from('employee_profiles')
        .insert({ 
          employee_id: employee_id, 
          profile_picture_url: uploadResult.url 
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    console.log('✅ Avatar upload completed successfully for employee:', employee_id);
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      employee_id: employee_id,
      avatar_url: uploadResult.url,
      profile: result
    });

  } catch (error) {
    console.error('❌ Error uploading avatar:', error);
    next(error);
  }
});

/**
 * DELETE /storage/logo - Delete company logo
 */
router.delete('/logo', async (req, res, next) => {
  try {
    if (!supabaseService) {
      return res.status(503).json({
        error: 'Service unavailable',
        details: 'Storage services are not properly configured.'
      });
    }

    // Clear logo URL from database
    const { data: existing } = await supabaseService.client
      .from('company_branding')
      .select('id, logo_url')
      .limit(1)
      .single();

    if (existing && existing.logo_url) {
      // Update database to remove logo URL
      const { error } = await supabaseService.client
        .from('company_branding')
        .update({ logo_url: null })
        .eq('id', existing.id);

      if (error) throw error;
    }

    res.json({
      success: true,
      message: 'Logo removed successfully'
    });

  } catch (error) {
    console.error('❌ Error removing logo:', error);
    next(error);
  }
});

module.exports = router;