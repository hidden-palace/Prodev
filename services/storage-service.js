const SupabaseService = require('./supabase-client');

class StorageService {
  constructor() {
    this.supabaseService = new SupabaseService();
    this.initializeBuckets();
  }

  /**
   * Initialize storage buckets if they don't exist
   */
  async initializeBuckets() {
    try {
      // Check if buckets exist, create if they don't
      await this.ensureBucketExists('logos', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024, // 2MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
      });
      
      await this.ensureBucketExists('employee_avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024, // 1MB
        allowedMimeTypes: ['image/png', 'image/jpeg']
      });
    } catch (error) {
      console.warn('⚠️ Could not initialize storage buckets:', error.message);
    }
  }

  /**
   * Ensure a storage bucket exists
   */
  async ensureBucketExists(bucketName, options = {}) {
    try {
      // Try to get bucket info
      const { data: bucket, error: getError } = await this.supabaseService.client.storage
        .getBucket(bucketName);

      if (getError && getError.message.includes('not found')) {
        console.log(`📦 Creating storage bucket: ${bucketName}`);
        
        // Create the bucket
        const { data, error: createError } = await this.supabaseService.client.storage
          .createBucket(bucketName, {
            public: options.public || true,
            fileSizeLimit: options.fileSizeLimit,
            allowedMimeTypes: options.allowedMimeTypes
          });

        if (createError) {
          console.error(`❌ Failed to create bucket ${bucketName}:`, createError);
          throw createError;
        }

        console.log(`✅ Created storage bucket: ${bucketName}`);
        return data;
      } else if (getError) {
        throw getError;
      }

      console.log(`✅ Storage bucket exists: ${bucketName}`);
      return bucket;
    } catch (error) {
      console.error(`❌ Error with bucket ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Upload logo file to Supabase Storage
   */
  async uploadLogo(file, fileName) {
    try {
      console.log('📤 Uploading logo:', fileName);
      
      // Ensure logos bucket exists
      await this.ensureBucketExists('logos', {
        public: true,
        fileSizeLimit: 2 * 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
      });
      
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
      const { data, error } = await this.supabaseService.client.storage
        .from('logos')
        .upload(uniqueFileName, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileType
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        
        // If bucket doesn't exist, try to create it and retry
        if (error.message.includes('not found') || error.message.includes('Bucket not found')) {
          console.log('🔄 Bucket not found, creating and retrying...');
          await this.ensureBucketExists('logos', {
            public: true,
            fileSizeLimit: 2 * 1024 * 1024,
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml']
          });
          
          // Retry upload
          const { data: retryData, error: retryError } = await this.supabaseService.client.storage
            .from('logos')
            .upload(uniqueFileName, fileBuffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: fileType
            });
            
          if (retryError) {
            throw retryError;
          }
          
          // Get public URL for retry
          const { data: retryUrlData } = this.supabaseService.client.storage
            .from('logos')
            .getPublicUrl(uniqueFileName);

          console.log('✅ Logo uploaded successfully (after retry):', retryUrlData.publicUrl);
          return {
            success: true,
            url: retryUrlData.publicUrl,
            fileName: uniqueFileName
          };
        }
        
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
      
      // Ensure employee_avatars bucket exists
      await this.ensureBucketExists('employee_avatars', {
        public: true,
        fileSizeLimit: 1024 * 1024,
        allowedMimeTypes: ['image/png', 'image/jpeg']
      });
      
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
      const { data, error } = await this.supabaseService.client.storage
        .from('employee_avatars')
        .upload(uniqueFileName, fileBuffer, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileType
        });

      if (error) {
        console.error('❌ Storage upload error:', error);
        
        // If bucket doesn't exist, try to create it and retry
        if (error.message.includes('not found') || error.message.includes('Bucket not found')) {
          console.log('🔄 Bucket not found, creating and retrying...');
          await this.ensureBucketExists('employee_avatars', {
            public: true,
            fileSizeLimit: 1024 * 1024,
            allowedMimeTypes: ['image/png', 'image/jpeg']
          });
          
          // Retry upload
          const { data: retryData, error: retryError } = await this.supabaseService.client.storage
            .from('employee_avatars')
            .upload(uniqueFileName, fileBuffer, {
              cacheControl: '3600',
              upsert: false,
              contentType: fileType
            });
            
          if (retryError) {
            throw retryError;
          }
          
          // Get public URL for retry
          const { data: retryUrlData } = this.supabaseService.client.storage
            .from('employee_avatars')
            .getPublicUrl(uniqueFileName);

          console.log('✅ Avatar uploaded successfully (after retry):', retryUrlData.publicUrl);
          return {
            success: true,
            url: retryUrlData.publicUrl,
            fileName: uniqueFileName
          };
        }
        
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