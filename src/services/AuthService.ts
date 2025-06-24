// src/services/AuthService.ts
import { AuthFormData } from '../machines/authFormMachine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuthService {
  /**
   * Enhanced email validation with security checks
   */
  private static isValidEmailFormat(email: string): boolean {
    // More robust email validation
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) return false;
    if (email.length > 254) return false; // RFC 5321 limit

    // Check for common disposable email domains
    const disposableDomains = ['10minutemail.com', 'tempmail.org', 'guerrillamail.com'];
    const domain = email.split('@')[1]?.toLowerCase();
    if (disposableDomains.includes(domain)) return false;

    return true;
  }

  /**
   * Enhanced password validation
   */
  static validatePasswordStrength(password: string): ValidationResult {
    const errors: string[] = [];

    if (password.length < 12) {
      errors.push('Password must be at least 12 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    // Pattern checks
    if (/(.)\1{3,}/.test(password)) {
      errors.push('Password cannot contain repeated characters');
    }

    // Common password check
    const commonPasswords = [
      'password123',
      '123456789',
      'qwerty123',
      'admin123',
      'welcome123',
      'letmein123',
      'password1',
      '123456abc',
    ];

    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      errors.push('Please choose a more secure password');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate login form data
   */
  static validateLoginForm(form: AuthFormData): ValidationResult {
    const errors: string[] = [];

    if (!form.email.trim()) {
      errors.push('Email is required');
    }

    if (!form.password.trim()) {
      errors.push('Password is required');
    }

    // Basic email format check
    if (form.email.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('Please enter a valid email address');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate signup form data with enhanced security
   */
  static validateSignupForm(form: AuthFormData): ValidationResult {
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

    // Enhanced email validation
    if (form.email?.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password confirmation check
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.push('Passwords do not match');
    }

    // Enhanced password validation
    if (form.password) {
      const passwordValidation = this.validatePasswordStrength(form.password);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate forgot password form data
   */
  static validateForgotPasswordForm(form: { email: string }): ValidationResult {
    const errors: string[] = [];

    if (!form.email.trim()) {
      errors.push('Email is required');
    }

    if (form.email.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('Please enter a valid email address');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Sanitize form data before submission
   */
  static sanitizeFormData(form: AuthFormData): AuthFormData {
    return {
      email: form.email.trim().toLowerCase(),
      password: form.password, // Don't trim passwords
      confirmPassword: form.confirmPassword, // Don't trim passwords
      fname: form.fname?.trim(),
      lname: form.lname?.trim(),
    };
  }

  /**
   * Create login payload from form data
   */
  static createLoginPayload(form: AuthFormData): { email: string; password: string } {
    const sanitized = this.sanitizeFormData(form);
    return {
      email: sanitized.email,
      password: sanitized.password,
    };
  }

  /**
   * Create signup payload from form data
   */
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
