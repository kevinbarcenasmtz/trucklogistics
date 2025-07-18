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
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!emailRegex.test(email)) return false;
    if (email.length > 254) return false;

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
      errors.push('PasswordTooShort', 'Password must be at least 12 characters long');
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

    if (/(.)\1{3,}/.test(password)) {
      errors.push('PasswordRepeatedChar', 'Password cannot contain repeated characters');
    }

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
      errors.push('PasswordTooCommon', 'Please choose a more secure password');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate login form data
   */
  static validateLoginForm(form: AuthFormData): ValidationResult {
    const errors: string[] = [];

    if (!form.email.trim()) {
      errors.push('EmailRequired', 'Email is required');
    }

    if (!form.password.trim()) {
      errors.push('PasswordRequired', 'Password is required');
    }

    if (form.email.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('EmailInvalid', 'Please enter a valid email address');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate signup form data with enhanced security
   */
  static validateSignupForm(form: AuthFormData): ValidationResult {
    const errors: string[] = [];

    if (!form.email?.trim()) {
      errors.push('EmailRequired', 'Email is required');
    }

    if (!form.password?.trim()) {
      errors.push('PasswordRequired', 'Password is required');
    }

    if (!form.confirmPassword?.trim()) {
      errors.push('ConfirmPasswordRequired', 'Confirm password is required');
    }

    if (!form.fname?.trim()) {
      errors.push('FirstNameRequired', 'First name is required');
    }

    if (!form.lname?.trim()) {
      errors.push('LastNameRequired', 'Last name is required');
    }

    if (form.email?.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('EmailInvalid', 'Please enter a valid email address');
    }

    if (form.password && form.confirmPassword && form.password !== form.confirmPassword) {
      errors.push('PasswordsDontMatch', 'Passwords do not match');
    }

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
      errors.push('EmailRequired', 'Email is required');
    }

    if (form.email.trim() && !this.isValidEmailFormat(form.email)) {
      errors.push('EmailInvalid', 'Please enter a valid email address');
    }

    return { isValid: errors.length === 0, errors };
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
