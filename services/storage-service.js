const SupabaseService = require('./supabase-client');

class StorageService {
  constructor() {
    this.supabaseService = new SupabaseService();
    console.log('✅ StorageService initialized');
  }

  /**
   * Upload logo file to Supabase Storage
   */
  async uploadLogo(file, fileName) {
    try {
      console.log('📤 Uploading logo:', fileName);
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
      const fileType = file.mimetype || file.type;
      if (!allowedTypes.includes(fileType)) {
        throw new Error('Invalid file type. Only PNG, JPG, and SVG files are allowed.');
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = fileName.split('.').pop() || 'png';
      const uniqueFileName = `logo_${timestamp}.${extension}`;

      // Prepare file buffer for upload
      const fileBuffer = file.buffer || file;
      
      // Upload to Supabase Storage
      const { data, error: uploadError } = await this.supabaseService.client.storage
        .from('logos')
        .upload(uniqueFileName, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileType
        });

      if (uploadError) {
        console.error('❌ Storage upload error:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = this.supabaseService.client.storage
        .from('logos')
        .getPublicUrl(uniqueFileName);

      console.log('✅ Logo uploaded successfully:', urlData.publicUrl);
      return {
        success: true,
        url: urlData.publicUrl,
        fileName: uniqueFileName
      };

    } catch (err) {
      console.error('❌ Failure uploading logo:', err);
      throw err;
    }
  }

  /**
   * Upload employee avatar to Supabase Storage
   */
  async uploadEmployeeAvatar(file, employeeId) {
    try {
      console.log('📤 Uploading avatar for employee:', employeeId);
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
      const fileType = file.mimetype || file.type;
      if (!allowedTypes.includes(fileType)) {
        throw new Error('Invalid file type. Only PNG and JPG files are allowed.');
      }

      // Validate file size (1MB)
      if (file.size > 1024 * 1024) {
        throw new Error('File size must be less than 1MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.originalname ? file.originalname.split('.').pop() : 'jpg';
      const uniqueFileName = `${employeeId}_${timestamp}.${extension}`;

      // Prepare file buffer for upload
      const fileBuffer = file.buffer || file;

      // Upload to Supabase Storage
      const { data, error: avatarUploadError } = await this.supabaseService.client.storage
        .from('employee-avatars')
        .upload(uniqueFileName, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileType
        });

      if (avatarUploadError) {
        console.error('❌ Storage upload error:', avatarUploadError);
        throw avatarUploadError;
      }

      // Get public URL
      const { data: urlData } = this.supabaseService.client.storage
        .from('employee-avatars')
        .getPublicUrl(uniqueFileName);

      console.log('✅ Avatar uploaded successfully:', urlData.publicUrl);
      
      // DEBUG: Log the exact values being sent to the upsert operation
      console.log(`🔍 DEBUG: About to upsert employee_id: '${employeeId}' with profile_picture_url: '${urlData.publicUrl}'`);

      // Update database with new avatar URL using upsert to bypass RLS
      const { data: result, error: dbUpsertError } = await this.supabaseService.client
        .from('employee_profiles')
        .upsert({ 
          employee_id: employeeId, 
          profile_picture_url: urlData.publicUrl 
        }, { 
          onConflict: 'employee_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (dbUpsertError) {
        console.error('❌ Database update error:', dbUpsertError);
        throw dbUpsertError;
      }

      return {
        success: true,
        url: urlData.publicUrl,
        fileName: uniqueFileName
      };

    } catch (err) {
      console.error('❌ Failure uploading avatar:', err);
      throw err;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket, fileName) {
    try {
      const { error: deleteError } = await this.supabaseService.client.storage
        .from(bucket)
        .remove([fileName]);

      if (deleteError) {
        console.error('❌ Error deleting file:', deleteError);
        throw deleteError;
      }

      console.log('✅ File deleted successfully:', fileName);
      return true;
    } catch (err) {
      console.error('❌ Failure deleting file:', err);
      throw err;
    }
  }

  /**
   * Validate image dimensions
   */
  validateImageDimensions(file, requirements) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const { width, height } = img;
        const { minWidth, minHeight, aspectRatio } = requirements;
        
        // Check minimum dimensions
        if (minWidth && width < minWidth) {
          reject(new Error(`Image width must be at least ${minWidth}px`));
          return;
        }
        
        if (minHeight && height < minHeight) {
          reject(new Error(`Image height must be at least ${minHeight}px`));
          return;
        }
        
        // Check aspect ratio for avatars
        if (aspectRatio === '1:1') {
          const ratio = width / height;
          if (Math.abs(ratio - 1) > 0.1) {
            reject(new Error('Image must have a 1:1 aspect ratio (square)'));
            return;
          }
        }
        
        resolve({ width, height });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Invalid image file'));
      };
      
      img.src = url;
    });
  }
}

module.exports = StorageService;