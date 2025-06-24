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

    // Basic email format check (will be enhanced later with security)
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

    // Password strength check (basic for now)
    if (form.password && form.password.length < 6) {
      errors.push('Password should be at least 6 characters');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Basic email format validation
   * (This will be enhanced with security patterns later)
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
      confirmPassword: form.confirmPassword?.trim(),
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
