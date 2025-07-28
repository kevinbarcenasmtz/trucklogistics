// src/services/camera/ReceiptDraftService.ts

import { safeDateString } from '@/src/utils/safeAccess';
import {
  FieldValidationError,
  FieldValidationResult,
  FormValidationResult,
} from '../../context/ReceiptDraftContext';
import { ProcessedReceipt } from '../../state/ocr/types';
import { Receipt } from '../../types/ReceiptInterfaces';

/**
 * Validation rules configuration
 */
export interface ValidationConfig {
  requiredFields: (keyof Receipt)[];
  amountMinimum: number;
  amountMaximum: number;
  dateRangeMonths: number; // How many months back/forward from today
  vehiclePatterns?: RegExp[];
  locationMaxLength: number;
  vendorNameMaxLength: number;
}

/**
 * Field difference for tracking changes
 */
export interface FieldDifference {
  field: keyof Receipt;
  originalValue: any;
  currentValue: any;
  hasChanged: boolean;
}

/**
 * Draft comparison result
 */
export interface DraftComparison {
  hasChanges: boolean;
  changedFields: (keyof Receipt)[];
  differences: FieldDifference[];
  changeCount: number;
}

/**
 * Receipt validation error codes
 */
export const VALIDATION_ERROR_CODES = {
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
  INVALID_RANGE: 'INVALID_RANGE',
  INVALID_DATE: 'INVALID_DATE',
  INVALID_AMOUNT: 'INVALID_AMOUNT',
  INVALID_TYPE: 'INVALID_TYPE',
  INVALID_STATUS: 'INVALID_STATUS',
  INVALID_LENGTH: 'INVALID_LENGTH',
  BUSINESS_RULE: 'BUSINESS_RULE',
} as const;

/**
 * Receipt Draft Service
 * Handles all receipt draft operations and validation
 */
export class ReceiptDraftService {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      requiredFields: ['date', 'type', 'amount', 'vehicle'],
      amountMinimum: 0.01,
      amountMaximum: 999999.99,
      dateRangeMonths: 12,
      locationMaxLength: 100,
      vendorNameMaxLength: 100,
      ...config,
    };
  }

  /**
   * Create draft from backend ProcessedReceipt
   */
  createDraftFromProcessedData(processedData: ProcessedReceipt): Receipt {
    const classification = processedData.classification;
    const currentTimestamp = new Date().toISOString();

    return {
      id: '', // Will be set when saved
      date: safeDateString(this.validateAndFormatDate(classification.date)),
      type: this.validateAndFormatType(classification.type),
      amount: this.validateAndFormatAmount(classification.amount),
      vehicle: classification.vehicle || '',
      status: 'Pending',
      extractedText: processedData.extractedText,
      imageUri: processedData.imageUri,
      vendorName: classification.vendorName || '',
      location: classification.location || '',
      timestamp: currentTimestamp,
    };
  }

  /**
   * Validate individual field
   */
  validateField(field: keyof Receipt, value: any, fullDraft?: Receipt): FieldValidationResult {
    const errors: FieldValidationError[] = [];

    try {
      switch (field) {
        case 'date':
          this.validateDateField(value, errors);
          break;
        case 'type':
          this.validateTypeField(value, errors);
          break;
        case 'amount':
          this.validateAmountField(value, errors);
          break;
        case 'vehicle':
          this.validateVehicleField(value, errors);
          break;
        case 'status':
          this.validateStatusField(value, errors);
          break;
        case 'vendorName':
          this.validateVendorNameField(value, errors);
          break;
        case 'location':
          this.validateLocationField(value, errors);
          break;
        case 'extractedText':
          this.validateExtractedTextField(value, errors);
          break;
        case 'imageUri':
          this.validateImageUriField(value, errors);
          break;
        case 'timestamp':
          this.validateTimestampField(value, errors);
          break;
        case 'id':
          // ID validation is handled during save
          break;
        default:
          errors.push({
            code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
            message: `Unknown field: ${field}`,
            severity: 'error',
          });
      }

      // Cross-field validation if full draft is provided
      if (fullDraft && errors.length === 0) {
        this.validateCrossField(field, value, fullDraft, errors);
      }
    } catch (error) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
      });
    }

    return {
      isValid: errors.filter(e => e.severity === 'error').length === 0,
      errors,
    };
  }

  /**
   * Validate entire receipt
   */
  validateReceipt(draft: Receipt): FormValidationResult {
    const fieldErrors: Record<string, FieldValidationError[]> = {};
    let hasErrors = false;
    let hasWarnings = false;

    // Validate each field
    (Object.keys(draft) as (keyof Receipt)[]).forEach(field => {
      const result = this.validateField(field, draft[field], draft);
      if (result.errors.length > 0) {
        fieldErrors[field] = result.errors;

        if (result.errors.some(e => e.severity === 'error')) {
          hasErrors = true;
        }
        if (result.errors.some(e => e.severity === 'warning')) {
          hasWarnings = true;
        }
      }
    });

    // Business rule validation
    this.validateBusinessRules(draft, fieldErrors);

    // Check if business rules added any errors
    Object.values(fieldErrors).forEach(errors => {
      if (errors.some(e => e.severity === 'error')) hasErrors = true;
      if (errors.some(e => e.severity === 'warning')) hasWarnings = true;
    });

    return {
      isValid: !hasErrors,
      fieldErrors,
      hasErrors,
      hasWarnings,
    };
  }

  /**
   * Transform draft to final Receipt format
   */
  transformToFinalReceipt(draft: Receipt, receiptId?: string): Receipt {
    const now = new Date().toISOString();

    return {
      ...draft,
      id: receiptId || this.generateReceiptId(),
      timestamp: now,
      // Ensure all required transformations
      amount: this.normalizeAmount(draft.amount),
      date: this.normalizeDate(draft.date),
      vendorName: this.normalizeText(draft.vendorName || ''),
      location: this.normalizeText(draft.location || ''),
    };
  }

  /**
   * Calculate field differences between drafts
   */
  calculateDifferences(original: Receipt, current: Receipt): DraftComparison {
    const differences: FieldDifference[] = [];
    const changedFields: (keyof Receipt)[] = [];

    (Object.keys(original) as (keyof Receipt)[]).forEach(field => {
      const originalValue = original[field];
      const currentValue = current[field];
      const hasChanged = !this.isEqual(originalValue, currentValue);

      differences.push({
        field,
        originalValue,
        currentValue,
        hasChanged,
      });

      if (hasChanged) {
        changedFields.push(field);
      }
    });

    return {
      hasChanges: changedFields.length > 0,
      changedFields,
      differences,
      changeCount: changedFields.length,
    };
  }

  /**
   * Get validation summary for UI display
   */
  getValidationSummary(draft: Receipt): {
    isValid: boolean;
    errorCount: number;
    warningCount: number;
    missingRequiredFields: string[];
    errorFields: string[];
  } {
    const validation = this.validateReceipt(draft);
    const errorFields: string[] = [];
    const missingRequiredFields: string[] = [];
    let errorCount = 0;
    let warningCount = 0;

    Object.entries(validation.fieldErrors).forEach(([field, errors]) => {
      const hasErrors = errors.some(e => e.severity === 'error');
      const hasWarnings = errors.some(e => e.severity === 'warning');

      if (hasErrors) {
        errorFields.push(field);
        errorCount += errors.filter(e => e.severity === 'error').length;
      }
      if (hasWarnings) {
        warningCount += errors.filter(e => e.severity === 'warning').length;
      }

      // Check for required field errors
      if (this.config.requiredFields.includes(field as keyof Receipt) && hasErrors) {
        missingRequiredFields.push(field);
      }
    });

    return {
      isValid: validation.isValid,
      errorCount,
      warningCount,
      missingRequiredFields,
      errorFields,
    };
  }

  // Private validation methods

  private validateDateField(value: any, errors: FieldValidationError[]): void {
    if (!value) {
      if (this.config.requiredFields.includes('date')) {
        errors.push({
          code: VALIDATION_ERROR_CODES.REQUIRED_FIELD,
          message: 'Date is required',
          severity: 'error',
        });
      }
      return;
    }

    if (typeof value !== 'string') {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
        message: 'Date must be a string',
        severity: 'error',
      });
      return;
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(value)) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
        message: 'Date must be in YYYY-MM-DD format',
        severity: 'error',
      });
      return;
    }

    // Validate date is valid
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_DATE,
        message: 'Invalid date',
        severity: 'error',
      });
      return;
    }

    // Validate date range
    const now = new Date();
    const monthsAgo = new Date();
    monthsAgo.setMonth(now.getMonth() - this.config.dateRangeMonths);
    const monthsFromNow = new Date();
    monthsFromNow.setMonth(now.getMonth() + this.config.dateRangeMonths);

    if (date < monthsAgo || date > monthsFromNow) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_RANGE,
        message: `Date must be within ${this.config.dateRangeMonths} months of today`,
        severity: 'warning',
      });
    }
  }

  private validateTypeField(value: any, errors: FieldValidationError[]): void {
    if (!value) {
      if (this.config.requiredFields.includes('type')) {
        errors.push({
          code: VALIDATION_ERROR_CODES.REQUIRED_FIELD,
          message: 'Type is required',
          severity: 'error',
        });
      }
      return;
    }

    const validTypes = ['Fuel', 'Maintenance', 'Other'];
    if (!validTypes.includes(value)) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_TYPE,
        message: `Type must be one of: ${validTypes.join(', ')}`,
        severity: 'error',
      });
    }
  }

  private validateAmountField(value: any, errors: FieldValidationError[]): void {
    if (!value) {
      if (this.config.requiredFields.includes('amount')) {
        errors.push({
          code: VALIDATION_ERROR_CODES.REQUIRED_FIELD,
          message: 'Amount is required',
          severity: 'error',
        });
      }
      return;
    }

    // Convert to number if string
    const amount = typeof value === 'string' ? parseFloat(value) : value;

    if (isNaN(amount)) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_AMOUNT,
        message: 'Amount must be a valid number',
        severity: 'error',
      });
      return;
    }

    if (amount < this.config.amountMinimum) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_RANGE,
        message: `Amount must be at least $${this.config.amountMinimum}`,
        severity: 'error',
      });
    }

    if (amount > this.config.amountMaximum) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_RANGE,
        message: `Amount cannot exceed $${this.config.amountMaximum}`,
        severity: 'error',
      });
    }
  }

  private validateVehicleField(value: any, errors: FieldValidationError[]): void {
    if (!value) {
      if (this.config.requiredFields.includes('vehicle')) {
        errors.push({
          code: VALIDATION_ERROR_CODES.REQUIRED_FIELD,
          message: 'Vehicle is required',
          severity: 'error',
        });
      }
      return;
    }

    if (typeof value !== 'string') {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
        message: 'Vehicle must be text',
        severity: 'error',
      });
      return;
    }

    // Optional: Validate against patterns if configured
    if (this.config.vehiclePatterns && this.config.vehiclePatterns.length > 0) {
      const isValid = this.config.vehiclePatterns.some(pattern => pattern.test(value));
      if (!isValid) {
        errors.push({
          code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
          message: 'Vehicle format is not recognized',
          severity: 'warning',
        });
      }
    }
  }

  private validateStatusField(value: any, errors: FieldValidationError[]): void {
    const validStatuses = ['Approved', 'Pending'];
    if (value && !validStatuses.includes(value)) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_STATUS,
        message: `Status must be one of: ${validStatuses.join(', ')}`,
        severity: 'error',
      });
    }
  }

  private validateVendorNameField(value: any, errors: FieldValidationError[]): void {
    if (value && typeof value === 'string' && value.length > this.config.vendorNameMaxLength) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_LENGTH,
        message: `Vendor name cannot exceed ${this.config.vendorNameMaxLength} characters`,
        severity: 'error',
      });
    }
  }

  private validateLocationField(value: any, errors: FieldValidationError[]): void {
    if (value && typeof value === 'string' && value.length > this.config.locationMaxLength) {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_LENGTH,
        message: `Location cannot exceed ${this.config.locationMaxLength} characters`,
        severity: 'error',
      });
    }
  }

  private validateExtractedTextField(value: any, errors: FieldValidationError[]): void {
    // Basic validation - extracted text should be a string
    if (value && typeof value !== 'string') {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
        message: 'Extracted text must be text',
        severity: 'error',
      });
    }
  }

  private validateImageUriField(value: any, errors: FieldValidationError[]): void {
    if (!value) {
      errors.push({
        code: VALIDATION_ERROR_CODES.REQUIRED_FIELD,
        message: 'Image URI is required',
        severity: 'error',
      });
      return;
    }

    if (typeof value !== 'string') {
      errors.push({
        code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
        message: 'Image URI must be text',
        severity: 'error',
      });
    }
  }

  private validateTimestampField(value: any, errors: FieldValidationError[]): void {
    if (value && typeof value === 'string') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        errors.push({
          code: VALIDATION_ERROR_CODES.INVALID_FORMAT,
          message: 'Invalid timestamp format',
          severity: 'error',
        });
      }
    }
  }

  private validateCrossField(
    field: keyof Receipt,
    value: any,
    draft: Receipt,
    errors: FieldValidationError[]
  ): void {
    // Cross-field validation rules

    // Example: If type is Fuel, amount should be reasonable for fuel
    if (field === 'amount' && draft.type === 'Fuel') {
      const amount = typeof value === 'string' ? parseFloat(value) : value;
      if (!isNaN(amount) && amount > 1000) {
        errors.push({
          code: VALIDATION_ERROR_CODES.BUSINESS_RULE,
          message: 'Fuel expense over $1000 seems unusually high',
          severity: 'warning',
        });
      }
    }

    // Example: Validate date vs timestamp consistency
    if (field === 'date' && draft.timestamp) {
      const receiptDate = new Date(value);
      const timestampDate = new Date(draft.timestamp);
      const daysDifference =
        Math.abs(receiptDate.getTime() - timestampDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDifference > 30) {
        errors.push({
          code: VALIDATION_ERROR_CODES.BUSINESS_RULE,
          message: 'Receipt date differs significantly from upload date',
          severity: 'warning',
        });
      }
    }
  }

  private validateBusinessRules(
    draft: Receipt,
    fieldErrors: Record<string, FieldValidationError[]>
  ): void {
    // Business rule: Maintenance expenses should have reasonable amounts
    if (draft.type === 'Maintenance') {
      const amount = typeof draft.amount === 'string' ? parseFloat(draft.amount) : draft.amount;
      if (!isNaN(amount) && amount > 5000) {
        if (!fieldErrors.amount) fieldErrors.amount = [];
        fieldErrors.amount.push({
          code: VALIDATION_ERROR_CODES.BUSINESS_RULE,
          message: 'Maintenance expense over $5000 requires additional verification',
          severity: 'warning',
        });
      }
    }

    // Business rule: Future dates should be warnings
    if (draft.date) {
      const receiptDate = new Date(draft.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (receiptDate > today) {
        if (!fieldErrors.date) fieldErrors.date = [];
        fieldErrors.date.push({
          code: VALIDATION_ERROR_CODES.BUSINESS_RULE,
          message: 'Future dated receipts require verification',
          severity: 'warning',
        });
      }
    }
  }

  // Utility methods

  private validateAndFormatDate(date: any): string | null {
    if (!date) return null;

    try {
      const parsed = new Date(date);
      if (isNaN(parsed.getTime())) return null;

      return safeDateString(parsed.toISOString().split('T')[0]);
    } catch {
      return null;
    }
  }

  private validateAndFormatType(type: any): Receipt['type'] {
    const validTypes: Receipt['type'][] = ['Fuel', 'Maintenance', 'Other'];
    return validTypes.includes(type) ? type : 'Other';
  }

  private validateAndFormatAmount(amount: any): string {
    if (!amount) return '0.00';

    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(num)) return '0.00';

    return Math.max(0, num).toFixed(2);
  }

  private normalizeAmount(amount: string): string {
    const num = parseFloat(amount);
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  private normalizeDate(date: string): string {
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? safeDateString(undefined) : safeDateString(date);
  }

  private normalizeText(text: string): string {
    return text ? text.trim() : '';
  }

  private generateReceiptId(): string {
    return `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }
}

export default ReceiptDraftService;
