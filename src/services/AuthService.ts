// src/services/AuthService.ts
import { AuthFormData } from '../machines/authFormMachine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuthService {
  /**
   * Format validation errors with smart grouping
   */
  static formatValidationErrors(errors: string[]): {
    grouped: string[];
    hasPasswordErrors: boolean;
  } {
    const passwordErrors = errors.filter(err => err.toLowerCase().includes('password'));
    const nameErrors = errors.filter(err => err.toLowerCase().includes('name'));
    const emailErrors = errors.filter(err => err.toLowerCase().includes('email'));
    const otherErrors = errors.filter(
      err =>
        !err.toLowerCase().includes('password') &&
        !err.toLowerCase().includes('name') &&
        !err.toLowerCase().includes('email')
    );

    const result: string[] = [];

    // Group password errors into helpful message
    if (passwordErrors.length > 0) {
      const requirements: string[] = [];
      if (passwordErrors.some(e => e.includes('8 characters'))) {
        requirements.push('at least 8 characters');
      }
      if (passwordErrors.some(e => e.includes('uppercase'))) {
        requirements.push('one uppercase letter');
      }
      if (passwordErrors.some(e => e.includes('lowercase'))) {
        requirements.push('one lowercase letter');
      }
      if (passwordErrors.some(e => e.includes('number'))) {
        requirements.push('one number');
      }
      if (passwordErrors.some(e => e.includes('special'))) {
        requirements.push('one special character');
      }
      if (passwordErrors.some(e => e.includes('match'))) {
        requirements.push('passwords must match');
      }

      if (requirements.length > 0) {
        result.push(`Password must contain: ${requirements.join(', ')}`);
      }
    }

    result.push(...emailErrors);
    result.push(...nameErrors);
    result.push(...otherErrors);

    return {
      grouped: result,
      hasPasswordErrors: passwordErrors.length > 0,
    };
  }

  /**
   * Enhanced email validation with security checks
   */
  private static isValidEmailFormat(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) return false;
    if (email.length > 254) return false;

    const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain && disposableDomains.includes(domain)) return false;

    return true;
  }

  /**
   * Enhanced password validation
   */
  static validatePasswordStrength(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('PasswordTooShort', 'Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push(
        'PasswordUppercaseRequired',
        'Password must contain at least one uppercase letter'
      );
    }

    if (!/[a-z]/.test(password)) {
      errors.push(
        'PasswordLowercaseRequired',
        'Password must contain at least one lowercase letter'
      );
    }

    if (!/[0-9]/.test(password)) {
      errors.push('PasswordNumberRequired', 'Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      errors.push(
        'PasswordSpecialCharRequired',
        'Password must contain at least one special character'
      );
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate login form data
   */
  static validateLoginForm(form: AuthFormData): {
    isValid: boolean;
    errors: string[];
    formattedErrors: string[];
  } {
    const errors: string[] = [];

    if (!form.email.trim()) {
      errors.push('Email is required');
    }

    if (!form.password.trim()) {
      errors.push('Password is required');
    }

    if (form.email.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('Please enter a valid email address');
    }

    const formatted = this.formatValidationErrors(errors);

    return {
      isValid: errors.length === 0,
      errors,
      formattedErrors: formatted.grouped,
    };
  }

  /**
   * Validate signup form data with enhanced security
   */
  static validateSignupForm(form: AuthFormData): {
    isValid: boolean;
    errors: string[];
    formattedErrors: string[];
    hasPasswordErrors: boolean;
  } {
    const errors: string[] = [];

    if (!form.email?.trim()) {
      errors.push('Email is required');
    }

    if (!form.password?.trim()) {
      errors.push('Password is required');
    }

    if (!form.confirmPassword?.trim()) {
      errors.push('Confirm password is required');
    }

    if (!form.fname?.trim()) {
      errors.push('First name is required');
    }

    if (!form.lname?.trim()) {
      errors.push('Last name is required');
    }

    if (form.email?.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('Please enter a valid email address');
    }

    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.push('Passwords do not match');
    }

    if (form.password) {
      const passwordValidation = this.validatePasswordStrength(form.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    const formatted = this.formatValidationErrors(errors);

    return {
      isValid: errors.length === 0,
      errors,
      formattedErrors: formatted.grouped,
      hasPasswordErrors: formatted.hasPasswordErrors,
    };
  }

  /**
   * Validate forgot password form data
   */
  static validateForgotPasswordForm(form: { email: string }): {
    isValid: boolean;
    errors: string[];
    formattedErrors: string[];
  } {
    const errors: string[] = [];

    if (!form.email.trim()) {
      errors.push('Email is required');
    }

    if (form.email.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('Please enter a valid email address');
    }

    const formatted = this.formatValidationErrors(errors);

    return {
      isValid: errors.length === 0,
      errors,
      formattedErrors: formatted.grouped,
    };
  }

  static sanitizeFormData(form: AuthFormData): AuthFormData {
    return {
      email: form.email.trim().toLowerCase(),
      password: form.password,
      confirmPassword: form.confirmPassword,
      fname: form.fname?.trim(),
      lname: form.lname?.trim(),
    };
  }

  static createLoginPayload(form: AuthFormData): { email: string; password: string } {
    const sanitized = this.sanitizeFormData(form);
    return {
      email: sanitized.email,
      password: sanitized.password,
    };
  }

  static createSignupPayload(form: AuthFormData): {
    email: string;
    password: string;
    fname: string;
    lname: string;
  } {
    const sanitized = this.sanitizeFormData(form);
    return {
      email: sanitized.email,
      password: sanitized.password,
      fname: sanitized.fname!,
      lname: sanitized.lname!,
    };
  }
}
