const SupabaseService = require('./supabase-client');

class StorageService {
  constructor() {
    this.supabaseService = new SupabaseService();
  }

  /**
   * Upload logo file to Supabase Storage
   */
  async uploadLogo(file, fileName) {
    try {
      console.log('📤 Uploading logo:', fileName);
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PNG, JPG, and SVG files are allowed.');
      }

      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error('File size must be less than 2MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const uniqueFileName = `logo_${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabaseService.client.storage
        .from('logos')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw error;
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

    } catch (error) {
      console.error('❌ Error uploading logo:', error);
      throw error;
    }
  }

  /**
   * Upload employee avatar to Supabase Storage
   */
  async uploadEmployeeAvatar(file, employeeId) {
    try {
      console.log('📤 Uploading avatar for employee:', employeeId);
      
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PNG and JPG files are allowed.');
      }

      // Validate file size (1MB)
      if (file.size > 1024 * 1024) {
        throw new Error('File size must be less than 1MB.');
      }

      // Generate unique filename
      const timestamp = Date.now();
      const extension = file.name.split('.').pop();
      const uniqueFileName = `${employeeId}_${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { data, error } = await this.supabaseService.client.storage
        .from('employee_avatars')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: urlData } = this.supabaseService.client.storage
        .from('employee_avatars')
        .getPublicUrl(uniqueFileName);

      console.log('✅ Avatar uploaded successfully:', urlData.publicUrl);
      return {
        success: true,
        url: urlData.publicUrl,
        fileName: uniqueFileName
      };

    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(bucket, fileName) {
    try {
      const { error } = await this.supabaseService.client.storage
        .from(bucket)
        .remove([fileName]);

      if (error) {
        console.error('❌ Error deleting file:', error);
        throw error;
      }

      console.log('✅ File deleted successfully:', fileName);
      return true;
    } catch (error) {
      console.error('❌ Error deleting file:', error);
      throw error;
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