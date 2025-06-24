// src/services/AuthService.ts
import { AuthFormData } from '../machines/authFormMachine';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class AuthService {
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
   * Validate signup form data
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

    // Email format validation
    if (form.email?.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('Please enter a valid email address');
    }

    // Password confirmation check
    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.push('Passwords do not match');
    }

    // Password strength validation
    const passwordErrors = this.validatePasswordStrength(form.password || '');
    if (passwordErrors.length > 0) {
      errors.push(...passwordErrors);
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
   * Validate password strength
   * Matches the validation in AuthContext
   */
  static validatePasswordStrength(password: string): string[] {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
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

    return errors;
  }

  /**
   * Basic email format validation
   */
  private static isValidEmailFormat(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
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
