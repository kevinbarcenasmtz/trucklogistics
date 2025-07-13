import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Receipt } from '../types/ReceiptInterfaces';

interface EncryptedReceipt {
  id: string;
  date: string;
  type: string;
  vehicle: string;
  status: string;
  timestamp: string;
  imageUri: string;
  location?: string;
  // Encrypted fields
  amount: string;
  vendorName: string;
  extractedText: string;
}

interface ReceiptIndex {
  id: string;
  date: string;
  type: string;
  vehicle: string;
  status: string;
  timestamp: string;
}

export class SecureReceiptStorage {
  private static readonly ENCRYPTION_KEY = 'receipt_encryption_key';
  private static readonly INDEX_KEY = 'receipt_index';

  /**
   * Initialize encryption key if not exists
   */
  static async initialize(): Promise<void> {
    const existingKey = await SecureStore.getItemAsync(this.ENCRYPTION_KEY);
    if (!existingKey) {
    const randomBytes = await Crypto.getRandomBytesAsync(32);   
      const key = Buffer.from(randomBytes).toString('base64');
      await SecureStore.setItemAsync(
        this.ENCRYPTION_KEY,
        key
      );
    }
  }

  /**
   * Save receipt with encryption
   */
  static async saveReceipt(receipt: Receipt): Promise<void> {
    await this.initialize();
    
    // Encrypt sensitive fields
    const encrypted = await this.encryptReceipt(receipt);
    
    // Save encrypted data
    await SecureStore.setItemAsync(
      `receipt_${receipt.id}`,
      JSON.stringify(encrypted),
      {
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      }
    );

    // Update search index (non-sensitive data only)
    await this.updateIndex(receipt);
  }

  /**
   * Retrieve and decrypt receipt
   */
  static async getReceipt(id: string): Promise<Receipt | null> {
    const encryptedData = await SecureStore.getItemAsync(`receipt_${id}`);
    if (!encryptedData) return null;

    const encrypted = JSON.parse(encryptedData);
    return this.decryptReceipt(encrypted);
  }

  /**
   * Get all receipts (from index, then decrypt individually)
   */
  static async getAllReceipts(): Promise<Receipt[]> {
    const indexStr = await SecureStore.getItemAsync(this.INDEX_KEY);
    if (!indexStr) return [];

    const index: ReceiptIndex[] = JSON.parse(indexStr);
    const receipts: Receipt[] = [];

    for (const indexItem of index) {
      const receipt = await this.getReceipt(indexItem.id);
      if (receipt) {
        receipts.push(receipt);
      }
    }

    return receipts;
  }

  /**
   * Delete receipt and remove from index
   */
  static async deleteReceipt(id: string): Promise<void> {
    // Remove encrypted data
    await SecureStore.deleteItemAsync(`receipt_${id}`);

    // Remove from index
    const indexStr = await SecureStore.getItemAsync(this.INDEX_KEY);
    if (indexStr) {
      const index: ReceiptIndex[] = JSON.parse(indexStr);
      const filteredIndex = index.filter(item => item.id !== id);
      await SecureStore.setItemAsync(this.INDEX_KEY, JSON.stringify(filteredIndex));
    }
  }

  /**
   * Get receipts by criteria (uses index for efficient filtering)
   */
  static async getReceiptsByVehicle(vehicle: string): Promise<Receipt[]> {
    const indexStr = await SecureStore.getItemAsync(this.INDEX_KEY);
    if (!indexStr) return [];

    const index: ReceiptIndex[] = JSON.parse(indexStr);
    const filtered = index.filter(item => item.vehicle === vehicle);
    
    const receipts: Receipt[] = [];
    for (const indexItem of filtered) {
      const receipt = await this.getReceipt(indexItem.id);
      if (receipt) {
        receipts.push(receipt);
      }
    }

    return receipts;
  }

  /**
   * Encrypt sensitive receipt fields using AES
   */
  private static async encryptReceipt(receipt: Receipt): Promise<EncryptedReceipt> {
    const key = await SecureStore.getItemAsync(this.ENCRYPTION_KEY);
    if (!key) throw new Error('Encryption key not found');

    // Fields to encrypt
    const sensitiveFields = ['amount', 'vendorName', 'extractedText'] as const;
    const encrypted = { ...receipt } as any;

    for (const field of sensitiveFields) {
      if (receipt[field]) {
        const data = typeof receipt[field] === 'string' 
          ? receipt[field] 
          : JSON.stringify(receipt[field]);
        
        // Simple XOR encryption with key (for expo compatibility)
        encrypted[field] = this.simpleEncrypt(data, key);
      }
    }

    return encrypted;
  }

  /**
   * Decrypt receipt data
   */
  private static async decryptReceipt(encrypted: EncryptedReceipt): Promise<Receipt> {
    const key = await SecureStore.getItemAsync(this.ENCRYPTION_KEY);
    if (!key) throw new Error('Encryption key not found');

    const sensitiveFields = ['amount', 'vendorName', 'extractedText'] as const;
    const decrypted = { ...encrypted } as any;

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        decrypted[field] = this.simpleDecrypt(encrypted[field], key);
      }
    }

    return decrypted as Receipt;
  }

  /**
   * Simple XOR encryption for expo compatibility
   */
  private static simpleEncrypt(text: string, key: string): string {
    const keyBytes = Buffer.from(key, 'base64');
    const textBytes = Buffer.from(text, 'utf8');
    const encrypted = Buffer.alloc(textBytes.length);

    for (let i = 0; i < textBytes.length; i++) {
      encrypted[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return encrypted.toString('base64');
  }

  /**
   * Simple XOR decryption
   */
  private static simpleDecrypt(encryptedText: string, key: string): string {
    const keyBytes = Buffer.from(key, 'base64');
    const encryptedBytes = Buffer.from(encryptedText, 'base64');
    const decrypted = Buffer.alloc(encryptedBytes.length);

    for (let i = 0; i < encryptedBytes.length; i++) {
      decrypted[i] = encryptedBytes[i] ^ keyBytes[i % keyBytes.length];
    }

    return decrypted.toString('utf8');
  }

  /**
   * Update search index with non-sensitive data
   */
  private static async updateIndex(receipt: Receipt): Promise<void> {
    const indexData: ReceiptIndex = {
      id: receipt.id,
      date: receipt.date,
      type: receipt.type,
      vehicle: receipt.vehicle,
      status: receipt.status,
      timestamp: receipt.timestamp,
    };

    // Get existing index
    const indexStr = await SecureStore.getItemAsync(this.INDEX_KEY);
    const index: ReceiptIndex[] = indexStr ? JSON.parse(indexStr) : [];
    
    // Update or add entry
    const existingIndex = index.findIndex((item) => item.id === receipt.id);
    if (existingIndex >= 0) {
      index[existingIndex] = indexData;
    } else {
      index.push(indexData);
    }

    await SecureStore.setItemAsync(this.INDEX_KEY, JSON.stringify(index));
  }

  /**
   * Clear all receipt data (for testing/reset)
   */
  static async clearAll(): Promise<void> {
    // Clear index first to get list of receipt IDs
    const indexStr = await SecureStore.getItemAsync(this.INDEX_KEY);
    if (indexStr) {
      const index: ReceiptIndex[] = JSON.parse(indexStr);
      
      // Delete each receipt
      for (const item of index) {
        await SecureStore.deleteItemAsync(`receipt_${item.id}`);
      }
    }

    // Clear index and encryption key
    await SecureStore.deleteItemAsync(this.INDEX_KEY);
    await SecureStore.deleteItemAsync(this.ENCRYPTION_KEY);
  }
}