// src/services/DocumentStorage.ts
import * as FileSystem from 'expo-file-system';
import { Receipt } from '../types/ReceiptInterfaces';

// Define the directory for storing documents
const DOCUMENTS_DIRECTORY = `${FileSystem.documentDirectory}receipts/`;

/**
 * DocumentStorage service for managing receipt documents
 */
export class DocumentStorage {
  /**
   * Initialize the receipts directory if it doesn't exist
   */
  static async initializeStorage(): Promise<void> {
    const dirInfo = await FileSystem.getInfoAsync(DOCUMENTS_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(DOCUMENTS_DIRECTORY, { intermediates: true });
    }
  }

  /**
   * Save a receipt document to the file system
   * @param receipt Receipt data to save
   * @returns Promise with the saved receipt
   */
  static async saveReceipt(receipt: Receipt): Promise<Receipt> {
    await this.initializeStorage();
    
    // Create unique ID if not provided
    if (!receipt.id) {
      receipt.id = Date.now().toString();
    }
    
    // Define path for receipt JSON
    const filePath = `${DOCUMENTS_DIRECTORY}${receipt.id}.json`;
    
    // If there's an image URI, copy the image to our documents directory
    if (receipt.imageUri && receipt.imageUri.startsWith('file://')) {
      const imageName = `${receipt.id}_image.jpg`;
      const destImageUri = `${DOCUMENTS_DIRECTORY}${imageName}`;
      
      try {
        await FileSystem.copyAsync({
          from: receipt.imageUri,
          to: destImageUri
        });
        
        // Update the receipt with the new image URI
        receipt.imageUri = destImageUri;
      } catch (error) {
        console.error('Error copying image:', error);
      }
    }
    
    // Save the receipt data
    await FileSystem.writeAsStringAsync(
      filePath,
      JSON.stringify(receipt)
    );
    
    return receipt;
  }

  /**
   * Load all receipts from storage
   * @returns Promise with array of Receipt objects
   */
  static async getAllReceipts(): Promise<Receipt[]> {
    await this.initializeStorage();
    
    try {
      const files = await FileSystem.readDirectoryAsync(DOCUMENTS_DIRECTORY);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      const receipts = await Promise.all(
        jsonFiles.map(async (file) => {
          const content = await FileSystem.readAsStringAsync(`${DOCUMENTS_DIRECTORY}${file}`);
          return JSON.parse(content) as Receipt;
        })
      );
      
      // Sort by date (newest first)
      return receipts.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch (error) {
      console.error('Error reading receipts:', error);
      return [];
    }
  }

  /**
   * Get receipts filtered by type
   * @param type Receipt type to filter by
   * @returns Promise with filtered receipts
   */
  static async getReceiptsByType(type: 'Fuel' | 'Maintenance' | 'Other'): Promise<Receipt[]> {
    const allReceipts = await this.getAllReceipts();
    return allReceipts.filter(receipt => receipt.type === type);
  }

  /**
   * Get receipts filtered by status
   * @param status Status to filter by
   * @returns Promise with filtered receipts
   */
  static async getReceiptsByStatus(status: 'Approved' | 'Pending'): Promise<Receipt[]> {
    const allReceipts = await this.getAllReceipts();
    return allReceipts.filter(receipt => receipt.status === status);
  }

  /**
   * Get receipts for a specific vehicle
   * @param vehicleId Vehicle ID to filter by
   * @returns Promise with filtered receipts
   */
  static async getReceiptsByVehicle(vehicleId: string): Promise<Receipt[]> {
    const allReceipts = await this.getAllReceipts();
    return allReceipts.filter(receipt => 
      receipt.vehicle.toLowerCase().includes(vehicleId.toLowerCase())
    );
  }
  
  /**
   * Get receipts within a date range
   * @param startDate Start date (ISO string)
   * @param endDate End date (ISO string)
   * @returns Promise with filtered receipts
   */
  static async getReceiptsByDateRange(startDate: string, endDate: string): Promise<Receipt[]> {
    const allReceipts = await this.getAllReceipts();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    
    return allReceipts.filter(receipt => {
      const receiptDate = new Date(receipt.date).getTime();
      return receiptDate >= start && receiptDate <= end;
    });
  }

  /**
   * Search receipts by text
   * @param searchText Text to search for
   * @returns Promise with matching receipts
   */
  static async searchReceipts(searchText: string): Promise<Receipt[]> {
    const allReceipts = await this.getAllReceipts();
    const lowerSearch = searchText.toLowerCase();
    
    return allReceipts.filter(receipt => {
      // Search in various receipt fields
      return (
        receipt.extractedText?.toLowerCase().includes(lowerSearch) ||
        receipt.vendorName?.toLowerCase().includes(lowerSearch) ||
        receipt.vehicle.toLowerCase().includes(lowerSearch) ||
        receipt.type.toLowerCase().includes(lowerSearch) ||
        receipt.amount.toLowerCase().includes(lowerSearch) ||
        receipt.location?.toLowerCase().includes(lowerSearch)
      );
    });
  }
  
  /**
   * Get a receipt by ID
   * @param id Receipt ID
   * @returns Promise with the receipt or null if not found
   */
  static async getReceiptById(id: string): Promise<Receipt | null> {
    try {
      const filePath = `${DOCUMENTS_DIRECTORY}${id}.json`;
      const content = await FileSystem.readAsStringAsync(filePath);
      return JSON.parse(content) as Receipt;
    } catch (error) {
      console.error('Error reading receipt:', error);
      return null;
    }
  }
  
  /**
   * Delete a receipt by ID
   * @param id Receipt ID to delete
   * @returns Promise indicating success
   */
  static async deleteReceipt(id: string): Promise<boolean> {
    try {
      const receipt = await this.getReceiptById(id);
      if (!receipt) return false;
      
      // Delete the receipt JSON file
      await FileSystem.deleteAsync(`${DOCUMENTS_DIRECTORY}${id}.json`);
      
      // Delete associated image if it exists and is in our directory
      if (receipt.imageUri && receipt.imageUri.includes(DOCUMENTS_DIRECTORY)) {
        await FileSystem.deleteAsync(receipt.imageUri);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting receipt:', error);
      return false;
    }
  }
  
  /**
   * Update a receipt's status
   * @param id Receipt ID
   * @param status New status
   * @returns Promise with the updated receipt
   */
  static async updateReceiptStatus(
    id: string, 
    status: 'Approved' | 'Pending'
  ): Promise<Receipt | null> {
    const receipt = await this.getReceiptById(id);
    if (!receipt) return null;
    
    receipt.status = status;
    return await this.saveReceipt(receipt);
  }
  
  /**
   * Get receipt statistics
   * @returns Promise with receipt statistics
   */
  static async getReceiptStatistics(): Promise<{
    totalCount: number;
    approvedCount: number;
    pendingCount: number;
    fuelCount: number;
    maintenanceCount: number;
    otherCount: number;
    totalAmount: number;
  }> {
    const allReceipts = await this.getAllReceipts();
    
    // Initialize statistics
    const stats = {
      totalCount: allReceipts.length,
      approvedCount: 0,
      pendingCount: 0,
      fuelCount: 0,
      maintenanceCount: 0,
      otherCount: 0,
      totalAmount: 0,
    };
    
    // Process each receipt
    allReceipts.forEach(receipt => {
      // Count by status
      if (receipt.status === 'Approved') {
        stats.approvedCount++;
      } else {
        stats.pendingCount++;
      }
      
      // Count by type
      if (receipt.type === 'Fuel') {
        stats.fuelCount++;
      } else if (receipt.type === 'Maintenance') {
        stats.maintenanceCount++;
      } else {
        stats.otherCount++;
      }
      
      // Add to total amount (strip currency symbols and convert to number)
      const amount = parseFloat(receipt.amount.replace(/[$,€£]/g, ''));
      if (!isNaN(amount)) {
        stats.totalAmount += amount;
      }
    });
    
    return stats;
  }
}