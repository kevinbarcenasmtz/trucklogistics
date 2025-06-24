// src/security/ErrorSanitizer.ts
export class SecurityError extends Error {
  constructor(
    message: string,
    public userMessage: string = message
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

export class ErrorSanitizer {
  private static readonly SAFE_ERROR_MESSAGES: Record<string, string> = {
    // Firebase auth errors -> user-safe messages
    'auth/user-not-found': 'Invalid email or password',
    'auth/wrong-password': 'Invalid email or password',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/weak-password': 'Password does not meet security requirements',
    'auth/user-disabled': 'This account has been disabled',
    'auth/too-many-requests': 'Please try again later',
    'auth/operation-not-allowed': 'This sign-in method is not enabled',

    // Google Sign-In errors
    SIGN_IN_CANCELLED: 'Sign in was cancelled',
    IN_PROGRESS: 'Sign in already in progress',
    PLAY_SERVICES_NOT_AVAILABLE: 'Google Play Services unavailable',
  };

  static sanitizeAuthError(error: any): string {
    // Log internal error for debugging (only in development)
    if (__DEV__) {
      console.warn('[AUTH ERROR - DEV ONLY]', {
        code: error.code,
        message: error.message,
      });
    }

    // Return safe message for user
    return this.SAFE_ERROR_MESSAGES[error.code] || 'Authentication failed. Please try again.';
  }

  static logSecurityEvent(event: string, details?: Record<string, any>) {
    if (__DEV__) {
      console.log(`[SECURITY] ${event}`, this.sanitizeLogData(details));
    }
    // In production, send to secure logging service
  }

  private static sanitizeLogData(data?: Record<string, any>): Record<string, any> {
    if (!data) return {};

    const sanitized = { ...data };
    const sensitiveKeys = ['password', 'token', 'idToken', 'email', 'credential'];

    sensitiveKeys.forEach(key => {
      if (sanitized[key]) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }
}
