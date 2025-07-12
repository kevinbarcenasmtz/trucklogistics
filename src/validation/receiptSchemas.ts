import { z } from 'zod';

// Amount validation with normalization
const AmountSchema = z
  .string()
  .transform(val => {
    // Remove currency symbols and spaces
    const cleaned = val.replace(/[$€£\s,]/g, '');
    const amount = parseFloat(cleaned);

    if (isNaN(amount)) {
      throw new Error('Invalid amount');
    }

    return `$${amount.toFixed(2)}`;
  })
  .refine(val => {
    const amount = parseFloat(val.substring(1));
    return amount >= 0 && amount <= 999999.99;
  }, 'Amount must be between $0.00 and $999,999.99');

// Date validation
const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')
  .refine(val => {
    const date = new Date(val);
    const now = new Date();
    const minDate = new Date('2020-01-01');

    return date >= minDate && date <= now;
  }, 'Date must be between 2020-01-01 and today');

// Receipt type enum
const ReceiptTypeSchema = z.enum(['Fuel', 'Maintenance', 'Other']);

// Vehicle ID validation
const VehicleSchema = z
  .string()
  .min(1, 'Vehicle ID is required')
  .max(50, 'Vehicle ID too long')
  .regex(/^[A-Z0-9\s\-]+$/i, 'Vehicle ID contains invalid characters');

// Main receipt schema
export const ReceiptSchema = z.object({
  id: z.string(),
  date: DateSchema,
  type: ReceiptTypeSchema,
  amount: AmountSchema,
  vehicle: VehicleSchema,
  vendorName: z.string().max(100),
  location: z.string().max(200).optional(),
  extractedText: z.string().max(5000),
  imageUri: z.url(),
  status: z.enum(['Pending', 'Approved', 'Rejected']),
  timestamp: z.string().datetime(),
  confidence: z.number().min(0).max(1).optional(),
});

// Classification result schema
export const AIClassificationSchema = z.object({
  date: DateSchema,
  type: ReceiptTypeSchema,
  amount: AmountSchema,
  vehicle: VehicleSchema,
  vendorName: z.string().max(100),
  location: z.string().max(200).optional(),
  confidence: z.number().min(0).max(1),
});

// Validation helper
export function validateReceipt(data: unknown): {
  success: boolean;
  data?: z.infer<typeof ReceiptSchema>;
  errors?: { field: string; message: string }[];
} {
  try {
    const validated = ReceiptSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    throw error;
  }
}
