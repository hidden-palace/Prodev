/**
 * Form Validation Service with Error Handling
 * Provides comprehensive form validation with user-friendly error messages
 */

class FormValidator {
  constructor() {
    this.rules = new Map();
    this.customValidators = new Map();
    this.setupDefaultValidators();
  }

  /**
   * Setup default validation rules
   */
  setupDefaultValidators() {
    this.customValidators.set('required', (value) => {
      if (value === null || value === undefined || value === '') {
        return 'This field is required';
      }
      return null;
    });

    this.customValidators.set('email', (value) => {
      if (!value) return null;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
      return null;
    });

    this.customValidators.set('phone', (value) => {
      if (!value) return null;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
        return 'Please enter a valid phone number';
      }
      return null;
    });

    this.customValidators.set('url', (value) => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return 'Please enter a valid URL';
      }
    });

    this.customValidators.set('minLength', (value, min) => {
      if (!value) return null;
      if (value.length < min) {
        return `Must be at least ${min} characters long`;
      }
      return null;
    });

    this.customValidators.set('maxLength', (value, max) => {
      if (!value) return null;
      if (value.length > max) {
        return `Must be no more than ${max} characters long`;
      }
      return null;
    });

    this.customValidators.set('pattern', (value, pattern, message) => {
      if (!value) return null;
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return message || 'Invalid format';
      }
      return null;
    });

    this.customValidators.set('numeric', (value) => {
      if (!value) return null;
      if (isNaN(value)) {
        return 'Must be a valid number';
      }
      return null;
    });

    this.customValidators.set('min', (value, min) => {
      if (!value) return null;
      if (parseFloat(value) < min) {
        return `Must be at least ${min}`;
      }
      return null;
    });

    this.customValidators.set('max', (value, max) => {
      if (!value) return null;
      if (parseFloat(value) > max) {
        return `Must be no more than ${max}`;
      }
      return null;
    });
  }

  /**
   * Add custom validator
   */
  addValidator(name, validatorFunction) {
    this.customValidators.set(name, validatorFunction);
  }

  /**
   * Set validation rules for a form
   */
  setRules(formId, rules) {
    this.rules.set(formId, rules);
  }

  /**
   * Validate form data
   */
  validate(formId, data) {
    const rules = this.rules.get(formId);
    if (!rules) {
      return { valid: true, errors: [] };
    }

    const errors = [];

    for (const [fieldName, fieldRules] of Object.entries(rules)) {
      const value = data[fieldName];
      const fieldErrors = this.validateField(fieldName, value, fieldRules);
      errors.push(...fieldErrors);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate individual field
   */
  validateField(fieldName, value, rules) {
    const errors = [];

    for (const rule of rules) {
      let validator, params, message;

      if (typeof rule === 'string') {
        validator = rule;
        params = [];
      } else if (typeof rule === 'object') {
        validator = rule.rule;
        params = rule.params || [];
        message = rule.message;
      }

      const validatorFunction = this.customValidators.get(validator);
      if (!validatorFunction) {
        console.warn(`Unknown validator: ${validator}`);
        continue;
      }

      const error = validatorFunction(value, ...params);
      if (error) {
        errors.push({
          field: fieldName,
          rule: validator,
          message: message || error
        });
        break; // Stop at first error for this field
      }
    }

    return errors;
  }

  /**
   * Validate form element in real-time
   */
  validateFormElement(formElement) {
    const formId = formElement.id || formElement.dataset.formId;
    const formData = new FormData(formElement);
    const data = Object.fromEntries(formData.entries());

    return this.validate(formId, data);
  }

  /**
   * Setup real-time validation for a form
   */
  setupRealTimeValidation(formElement) {
    const formId = formElement.id || formElement.dataset.formId;
    const rules = this.rules.get(formId);
    
    if (!rules) return;

    // Add event listeners for real-time validation
    Object.keys(rules).forEach(fieldName => {
      const field = formElement.querySelector(`[name="${fieldName}"]`);
      if (!field) return;

      const validateFieldRealTime = () => {
        const value = field.value;
        const fieldRules = rules[fieldName];
        const errors = this.validateField(fieldName, value, fieldRules);

        // Clear previous errors
        this.clearFieldErrors(field);

        // Show new errors
        if (errors.length > 0) {
          this.showFieldErrors(field, errors);
        }
      };

      // Validate on blur and input (with debounce)
      field.addEventListener('blur', validateFieldRealTime);
      
      let timeout;
      field.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(validateFieldRealTime, 300);
      });
    });
  }

  /**
   * Clear field errors
   */
  clearFieldErrors(field) {
    field.classList.remove('error', 'invalid');
    const errorElements = field.parentElement.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());
  }

  /**
   * Show field errors
   */
  showFieldErrors(field, errors) {
    field.classList.add('error', 'invalid');

    errors.forEach(error => {
      const errorElement = document.createElement('div');
      errorElement.className = 'field-error';
      errorElement.textContent = error.message;
      field.parentElement.appendChild(errorElement);
    });
  }

  /**
   * Validate file uploads
   */
  validateFile(file, rules = {}) {
    const errors = [];

    // Check file size
    if (rules.maxSize && file.size > rules.maxSize) {
      errors.push({
        field: 'file',
        rule: 'maxSize',
        message: `File size must be less than ${this.formatFileSize(rules.maxSize)}`
      });
    }

    // Check file type
    if (rules.allowedTypes && !rules.allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        rule: 'fileType',
        message: `File type must be one of: ${rules.allowedTypes.join(', ')}`
      });
    }

    // Check file extension
    if (rules.allowedExtensions) {
      const extension = file.name.split('.').pop().toLowerCase();
      if (!rules.allowedExtensions.includes(extension)) {
        errors.push({
          field: 'file',
          rule: 'fileExtension',
          message: `File extension must be one of: ${rules.allowedExtensions.join(', ')}`
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Common validation rule sets
   */
  static getCommonRules() {
    return {
      email: [
        'required',
        'email'
      ],
      password: [
        'required',
        { rule: 'minLength', params: [8], message: 'Password must be at least 8 characters' },
        { rule: 'pattern', params: ['^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)', 'Password must contain at least one lowercase letter, one uppercase letter, and one number'] }
      ],
      phone: [
        'required',
        'phone'
      ],
      url: [
        'url'
      ],
      businessName: [
        'required',
        { rule: 'minLength', params: [2] },
        { rule: 'maxLength', params: [100] }
      ],
      contactName: [
        'required',
        { rule: 'minLength', params: [2] },
        { rule: 'maxLength', params: [50] }
      ]
    };
  }
}

// Export singleton instance
const formValidator = new FormValidator();
export default formValidator;