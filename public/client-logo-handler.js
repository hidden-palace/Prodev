/**
 * Client-Side Logo Handler
 * Handles dynamic logo retrieval and display from company_branding table
 */

class LogoHandler {
  constructor() {
    this.logoElement = null;
    this.fallbackElement = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    
    this.init();
  }

  /**
   * Initialize logo handler
   */
  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupLogo());
    } else {
      this.setupLogo();
    }
  }

  /**
   * Setup logo elements and fetch logo data
   */
  async setupLogo() {
    try {
      // Find logo elements in the DOM
      this.logoElement = document.getElementById('company-logo-img');
      this.fallbackElement = document.querySelector('.logo-icon');
      
      if (!this.logoElement) {
        console.warn('Logo image element not found');
        return;
      }

      // Fetch and display logo
      await this.fetchAndDisplayLogo();
      
      // Set up error handling for broken images
      this.setupImageErrorHandling();
      
    } catch (error) {
      console.error('Failed to setup logo:', error);
      this.showFallbackLogo();
    }
  }

  /**
   * Fetch logo data from company_branding table via API
   */
  async fetchAndDisplayLogo() {
    try {
      console.log('Fetching company branding data...');
      
      const response = await fetch('/api/branding', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-cache'
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const brandingData = await response.json();
      console.log('Branding data received:', { hasLogo: !!brandingData.logo_url });

      if (brandingData.logo_url && brandingData.logo_url.trim() !== '') {
        await this.displayLogo(brandingData.logo_url);
      } else {
        console.log('No logo URL found in branding data, showing fallback');
        this.showFallbackLogo();
      }

    } catch (error) {
      console.error('Error fetching logo:', error);
      
      // Retry logic for transient failures
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`Retrying logo fetch (attempt ${this.retryCount}/${this.maxRetries})`);
        
        setTimeout(() => {
          this.fetchAndDisplayLogo();
        }, 2000 * this.retryCount); // Exponential backoff
      } else {
        console.error('Max retries reached, showing fallback logo');
        this.showFallbackLogo();
      }
    }
  }

  /**
   * Display the logo image
   */
  async displayLogo(logoUrl) {
    return new Promise((resolve, reject) => {
      if (!this.logoElement) {
        reject(new Error('Logo element not available'));
        return;
      }

      // Create a temporary image to test if the URL is valid
      const testImage = new Image();
      
      testImage.onload = () => {
        // Image loaded successfully, update the main logo element
        this.logoElement.src = logoUrl;
        this.logoElement.alt = 'Company Logo';
        this.logoElement.style.display = 'block';
        
        // Hide fallback logo
        if (this.fallbackElement) {
          this.fallbackElement.style.display = 'none';
        }
        
        console.log('Logo displayed successfully:', logoUrl);
        resolve();
      };
      
      testImage.onerror = () => {
        console.error('Failed to load logo image:', logoUrl);
        this.showFallbackLogo();
        reject(new Error('Logo image failed to load'));
      };
      
      // Start loading the test image
      testImage.src = logoUrl;
    });
  }

  /**
   * Show fallback text logo when image logo is unavailable
   */
  showFallbackLogo() {
    if (this.logoElement) {
      this.logoElement.style.display = 'none';
    }
    
    if (this.fallbackElement) {
      this.fallbackElement.style.display = 'flex';
      console.log('Fallback text logo displayed');
    }
  }

  /**
   * Setup error handling for logo image loading failures
   */
  setupImageErrorHandling() {
    if (this.logoElement) {
      this.logoElement.addEventListener('error', () => {
        console.error('Logo image failed to load, showing fallback');
        this.showFallbackLogo();
      });
    }
  }

  /**
   * Refresh logo (useful for after logo uploads)
   */
  async refreshLogo() {
    this.retryCount = 0; // Reset retry count
    await this.fetchAndDisplayLogo();
  }

  /**
   * Get current logo status
   */
  getLogoStatus() {
    return {
      hasImageLogo: this.logoElement && this.logoElement.style.display !== 'none' && this.logoElement.src,
      logoUrl: this.logoElement ? this.logoElement.src : null,
      isUsingFallback: this.fallbackElement && this.fallbackElement.style.display !== 'none'
    };
  }
}

// Create global instance
const logoHandler = new LogoHandler();

// Make it globally available for manual refresh after uploads
window.logoHandler = logoHandler;