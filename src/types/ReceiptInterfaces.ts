// src/types/ReceiptInterfaces.ts
export interface Receipt {
    id: string;
    date: string;
    type: 'Fuel' | 'Maintenance' | 'Other';
    amount: string;
    vehicle: string;
    status: 'Approved' | 'Pending';
    extractedText: string;
    imageUri: string;
    vendorName?: string;
    location?: string;
    timestamp: string;
  }
  
  export interface AIClassifiedReceipt {
    date: string;
    type: 'Fuel' | 'Maintenance' | 'Other';
    amount: string;
    vehicle: string;
    vendorName: string;
    location?: string;
    confidence: number;
  }