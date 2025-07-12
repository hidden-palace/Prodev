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
    
    // Additional validation
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        details: 'Only PNG, JPEG, and SVG files are allowed for logos.'
      });
    }
    
    if (req.file.size > 2 * 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        details: 'Logo file size must be less than 2MB.'
      });
    }

    // Upload to storage
    const uploadResult = await storageService.uploadLogo(req.file, req.file.originalname);

    // Update database with new logo URL using upsert
    const { data: result, error } = await supabaseService.client
      .from('company_branding')
      .upsert({ 
        id: '00000000-0000-0000-0000-000000000001', // Use a fixed UUID for single row
        logo_url: uploadResult.url 
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Database update error:', error);
      throw error;
    }

    console.log('✅ Logo upload completed successfully');
    res.json({
      success: true,
      message: 'Logo uploaded successfully',
      logo_url: uploadResult.url,
      branding: result
    });

  } catch (uploadError) {
    console.error('❌ Error uploading logo:', uploadError);
    
    // Enhanced error response for debugging
    const errorResponse = {
      error: 'Logo upload failed',
      details: uploadError.message,
      suggestion: uploadError.message.includes('Bucket not found') ? 
        'The storage buckets may not exist. Please check your Supabase dashboard and ensure the "logos" bucket is created.' : 
        'Check your Supabase configuration and file format.',
      context: {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        supabaseConfigured: !!(process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY),
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
  console.log('DEBUG: Entered /api/storage/employee-avatar route handler.');
  console.log('DEBUG: Multer processed file, proceeding to try/catch block.');
  
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

    // Additional validation for file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        details: 'Only PNG and JPG files are allowed for avatars.'
      });
    }

    // Additional validation for file size
    if (req.file.size > 1024 * 1024) {
      return res.status(400).json({
        error: 'File too large',
        details: 'Avatar file size must be less than 1MB.'
      });
    }

    // Upload to storage
    const uploadResult = await storageService.uploadEmployeeAvatar(req.file, employee_id);
    
    // Update database with new avatar URL using upsert to bypass RLS
    const { data: result, error: updateError } = await supabaseService.client
      .from('employee_profiles')
      .upsert({ 
        employee_id: employee_id, 
        profile_picture_url: uploadResult.url 
      }, { 
        onConflict: 'employee_id',
        ignoreDuplicates: false 
      })
      .select()
      .single();

    if (updateError) {
      console.error('❌ Database update error:', updateError);
      throw updateError;
    }

    console.log('✅ Avatar upload completed successfully for employee:', employee_id);
    res.json({
      success: true,
      message: 'Avatar uploaded successfully',
      employee_id: employee_id,
      avatar_url: uploadResult.url,
      profile: result
    });

  } catch (uploadError) {
    console.error('❌ Error uploading avatar:', uploadError);
    
    // Enhanced error response for debugging
    const errorResponse = {
      error: 'Avatar upload failed',
      details: uploadError.message,
      context: {
        hasFile: !!req.file,
        fileName: req.file?.originalname,
        fileSize: req.file?.size,
        mimeType: req.file?.mimetype,
        employeeId: req.body?.employee_id,
        timestamp: new Date().toISOString()
      }
    };
    
    res.status(500).json(errorResponse);
    next(uploadError);
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

  } catch (deleteError) {
    console.error('❌ Error removing logo:', deleteError);
    next(deleteError);
  }
});

module.exports = router;