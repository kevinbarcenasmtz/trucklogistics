// src/utils/safeAccess.ts

/**
 * Safe array access with fallback
 */
export const safeArrayAccess = <T>(
  array: T[] | undefined | null,
  index: number,
  fallback: T
): T => {
  if (!array || index < 0 || index >= array.length) {
    return fallback;
  }
  return array[index]!; // Non-null assertion after bounds check
};

/**
 * Safe property access with type validation
 */
export const safeProperty = <T>(
  obj: any,
  property: string,
  fallback: T,
  validator?: (value: any) => boolean
): T => {
  if (!obj || typeof obj !== 'object') return fallback;

  const value = obj[property];
  if (value === undefined || value === null) return fallback;
  if (validator && !validator(value)) return fallback;

  return value as T;
};

/**
 * Safe string access - ensures string type
 */
export const safeString = (value: any, fallback = ''): string => {
  if (typeof value === 'string') return value;
  return fallback;
};

/**
 * Safe date string formatting
 */
export const safeDateString = (dateValue: any): string => {
  if (typeof dateValue === 'string' && dateValue.length > 0) {
    return dateValue;
  }
  const fallback = new Date().toISOString().split('T')[0];
  return fallback!; // Non-null assertion since we control the creation
};

/**
 * Safe field error access - handles possibly undefined error arrays
 */
export const safeFieldErrors = (
  fieldErrors: Record<string, any[]> | undefined,
  field: string
): any[] => {
  if (!fieldErrors || !fieldErrors[field]) return [];
  return fieldErrors[field]!; // Non-null assertion after check
};

/**
 * Safe object property with null check
 */
export const safeObjectAccess = <T>(obj: any, path: string[], fallback: T): T => {
  let current = obj;
  for (const key of path) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return fallback;
    }
    current = current[key];
  }
  return current === undefined || current === null ? fallback : (current as T);
};

/**
 * Safe correlation ID parsing
 */
export const safeParseInt = (value: string | undefined, fallback = 0): number => {
  if (!value || typeof value !== 'string') return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

/**
 * Safe buffer/array access for encryption
 */
export const safeBufferAccess = (
  buffer: Uint8Array | undefined,
  index: number,
  fallback = 0
): number => {
  if (!buffer || index < 0 || index >= buffer.length) return fallback;
  return buffer[index]!; // Non-null assertion after bounds check
};

/**
 * Safe domain extraction from email
 */
export const safeDomainExtract = (email: string): string => {
  if (!email || typeof email !== 'string') return '';
  const parts = email.split('@');
  if (parts.length < 2) return '';
  const domain = parts[1];
  return domain ? domain.toLowerCase() : '';
};

/**
 * Safe object property check with type guard
 */
export const hasProperty = <T extends object, K extends string>(
  obj: T,
  property: K
): obj is T & Record<K, unknown> => {
  return obj && typeof obj === 'object' && property in obj;
};

/**
 * Safe field validation error access - creates proper FieldValidationError fallback
 */
export const safeFieldValidationError = (
  errors: any[] | undefined,
  index: number
): { code: string; message: string; severity: 'error' | 'warning' } => {
  if (!errors || index < 0 || index >= errors.length) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Unknown validation error',
      severity: 'error' as const,
    };
  }
  return errors[index]!;
};
