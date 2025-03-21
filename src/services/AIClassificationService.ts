// src/services/AIClassificationService.ts
import { AIClassifiedReceipt } from '../types/ReceiptInterfaces';
import Anthropic from '@anthropic-ai/sdk';
import Constants from 'expo-constants';

/**
 * Service to handle AI classification of receipt text
 */
export class AIClassificationService {
  private static API_KEY = 
    Constants.expoConfig?.extra?.anthropicApiKey || 
    process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    
  private static MODEL = 'claude-3-7-sonnet-20250219'; // Use available model

  /**
   * Get Anthropic client instance
   */
  private static getClient(): Anthropic | null {
    if (!this.API_KEY || this.API_KEY.trim() === '') {
      console.warn('Anthropic API key not configured. Please check your environment variables.');
      return null;
    }
    
    return new Anthropic({
      apiKey: this.API_KEY,
      // Add optional parameters for better reliability
      maxRetries: 3,
      timeout: 30000, // 30 seconds
    });
  }

  /**
   * Classify receipt text using AI
   * 
   * @param extractedText The raw text extracted from the receipt image
   * @returns Classified receipt data
   */
  static async classifyReceipt(extractedText: string): Promise<AIClassifiedReceipt> {
    // Skip API call if text is too short
    if (extractedText.length < 10) {
      console.log('Text too short - using fallback classification method');
      return this.fallbackClassification(extractedText);
    }

    const client = this.getClient();
    
    // If no client (no API key), use fallback
    if (!client) {
      console.log('No API key - using fallback classification method');
      return this.fallbackClassification(extractedText);
    }

    try {
      const message = await client.messages.create({
        model: this.MODEL,
        max_tokens: 1000,
        system: "You are an expert at analyzing receipt data. Extract the structured information from the provided receipt text.",
        messages: [
          {
            role: "user",
            content: `Analyze this receipt text and extract the following information:
              - date: The receipt date in YYYY-MM-DD format
              - type: Either "Fuel", "Material Transportation", or "Other"
              - amount: The total amount paid
              - vehicle: Any vehicle identification
              - vendorName: The name of the business
              - location: The address if available
              
              Format your response as valid JSON with these exact field names.
              
              Raw receipt text:
              ${extractedText}`
          }
        ]
      });

      // Extract the text content from the message
      let textContent = '';
      if (message.content && Array.isArray(message.content)) {
        for (const block of message.content) {
          // Type guard to check for text blocks
          if ('type' in block && block.type === 'text' && 'text' in block) {
            textContent += block.text;
          }
        }
      }
      
      // Try to parse JSON from the text response
      try {
        // Find JSON in the text (Claude sometimes wraps JSON in markdown)
        const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                         textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                         textContent.match(/{[\s\S]*?}/);
                         
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : textContent;
        const parsedResult = JSON.parse(jsonStr.replace(/```/g, '').trim());
        
        // Ensure all required fields exist with defaults if needed
        return {
          date: parsedResult.date || new Date().toISOString().split('T')[0],
          type: this.validateReceiptType(parsedResult.type),
          amount: this.formatAmount(parsedResult.amount),
          vehicle: parsedResult.vehicle || 'Unknown Vehicle',
          vendorName: parsedResult.vendorName || 'Unknown Vendor',
          location: parsedResult.location || '',
          confidence: 0.85
        };
      } catch (parseError) {
        console.error('Failed to parse Claude JSON response:', parseError);
        return this.fallbackClassification(extractedText);
      }
    } catch (error) {
      console.log('API error:', error);
      console.log('Using fallback classification method');
      return this.fallbackClassification(extractedText);
    }
  }
  
  // Rest of the class remains the same...
  // ...
  
  // Include existing methods below
  
  /**
   * Validate and normalize receipt type
   */
  private static validateReceiptType(type?: string): 'Fuel' | 'Maintenance' | 'Other' {
    if (!type) return 'Other';
    
    const normalizedType = type.trim().toLowerCase();
    
    if (['fuel', 'gas', 'diesel'].includes(normalizedType)) {
      return 'Fuel';
    } else if (['maintenance', 'repair', 'service'].includes(normalizedType)) {
      return 'Maintenance';
    } else {
      return 'Other';
    }
  }
  
  /**
   * Format amount to ensure consistent format
   */
  private static formatAmount(amount?: string): string {
    if (!amount) return '$0.00';
    
    // If it already has a currency symbol, clean it up
    if (amount.includes('$') || amount.includes('€') || amount.includes('£')) {
      // Remove spaces between currency symbol and amount
      amount = amount.replace(/([€£$])\s+/g, '$1');
      return amount;
    }
    
    // Try to parse as a number and format
    const amountNum = parseFloat(amount.replace(/,/g, ''));
    if (isNaN(amountNum)) return '$0.00';
    
    return `$${amountNum.toFixed(2)}`;
  }
  
  /**
   * Fallback method to classify text if the API call fails
   */
  private static fallbackClassification(text: string): AIClassifiedReceipt {
    return {
      date: this.extractDate(text),
      type: this.determineReceiptType(text),
      amount: this.extractAmount(text),
      vehicle: this.extractVehicle(text),
      vendorName: this.extractVendorName(text),
      location: this.extractLocation(text),
      confidence: 0.6 // Lower confidence for fallback method
    };
  }
  
  /**
   * Extract date from text
   */
  private static extractDate(text: string): string {
    // Common date formats
    const datePatterns = [
      // MM/DD/YYYY or MM-DD-YYYY
      /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])[\/\-](19|20)?\d{2}\b/,
      // YYYY/MM/DD or YYYY-MM-DD
      /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12]\d|3[01])\b/,
      // DD/MM/YYYY or DD-MM-YYYY (less common in receipts but possible)
      /\b(0?[1-9]|[12]\d|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](19|20)?\d{2}\b/,
      // Month written out: Jan 1, 2023 or January 1, 2023
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+(19|20)\d{2}\b/i
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match && match[0]) {
        return match[0];
      }
    }
    
    // Date with keywords
    const dateKeywordPattern = /(?:date|issued|purchased)(?:\s*:\s*|\s+)([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i;
    const keywordMatch = text.match(dateKeywordPattern);
    if (keywordMatch && keywordMatch[1]) {
      return keywordMatch[1];
    }
    
    // Default to current date if not found
    return new Date().toISOString().split('T')[0];
  }
  
  /**
   * Extract amount from text
   */
  private static extractAmount(text: string): string {
    // Look for currency amounts
    const amountRegex = /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP)/g;
    const matches = text.match(amountRegex);
    
    if (matches && matches.length > 0) {
      // Find the largest amount, which is likely the total
      let largestAmount = 0;
      let largestAmountStr = '';
      
      for (const match of matches) {
        const numStr = match.replace(/[$,USD€£\s]/g, '');
        const num = parseFloat(numStr);
        if (!isNaN(num) && num > largestAmount) {
          largestAmount = num;
          largestAmountStr = match;
        }
      }
      
      if (largestAmountStr) {
        return largestAmountStr;
      }
    }
    
    // Try with keywords
    const totalRegex = /(?:total|amount|due|balance|payment)[^0-9]*?(\$?\s*\d+(?:,\d{3})*(?:\.\d{2})?)/i;
    const totalMatch = text.match(totalRegex);
    
    if (totalMatch && totalMatch[1]) {
      return totalMatch[1].trim();
    }
    
    return "$0.00";
  }
  
  /**
   * Determine receipt type based on keywords
   */
  private static determineReceiptType(text: string): 'Fuel' | 'Maintenance' | 'Other' {
    const lowerText = text.toLowerCase();
    
    // Fuel keywords
    const fuelKeywords = [
      'fuel', 'gas', 'diesel', 'gasoline', 'petrol',
      'gallon', 'gal', 'litre', 'liter', 'pump',
      'unleaded', 'regular', 'premium', 'octane',
      'filling station', 'gas station', 'service station'
    ];
    
    // Maintenance keywords
    const maintenanceKeywords = [
      'repair', 'maintenance', 'service', 'parts', 'labor',
      'oil change', 'tire', 'tyre', 'brake', 'filter',
      'mechanic', 'garage', 'auto shop', 'body shop',
      'inspection', 'diagnostic', 'alignment', 'replacement'
    ];
    
    // Check for fuel keywords
    for (const keyword of fuelKeywords) {
      if (lowerText.includes(keyword)) {
        return 'Fuel';
      }
    }
    
    // Check for maintenance keywords
    for (const keyword of maintenanceKeywords) {
      if (lowerText.includes(keyword)) {
        return 'Maintenance';
      }
    }
    
    // Default
    return 'Other';
  }
  
  /**
   * Extract vehicle information
   */
  private static extractVehicle(text: string): string {
    // Regular expressions for vehicle identification
    const patterns = [
      // Vehicle ID, Unit #, Truck #, etc.
      /(?:vehicle|truck|car|unit|veh|fleet|equip(?:ment)?)\s*(?:id|number|no|#|code)?[:. ]*([a-z0-9-]{1,10})/i,
      // VIN (Vehicle Identification Number)
      /VIN[:. ]*([A-Z0-9]{6,17})/i,
      // License plate
      /(?:license|plate|reg(?:istration)?)\s*(?:no|#|number)?[:. ]*([A-Z0-9]{5,10})/i
    ];
    
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return `Truck ${match[1].toUpperCase()}`;
      }
    }
    
    // Look for make/model patterns
    const makeModelPattern = /(ford|chevy|chevrolet|dodge|gmc|freightliner|peterbilt|kenworth|volvo|international|mack)\s+([a-z0-9-]+)/i;
    const makeModelMatch = text.match(makeModelPattern);
    
    if (makeModelMatch && makeModelMatch[1] && makeModelMatch[2]) {
      return `${makeModelMatch[1].charAt(0).toUpperCase() + makeModelMatch[1].slice(1)} ${makeModelMatch[2].toUpperCase()}`;
    }
    
    // Default
    return "Unknown Vehicle";
  }
  
  /**
   * Extract vendor name from receipt
   */
  private static extractVendorName(text: string): string {
    const lines = text.split('\n');
    
    // Common vendor keywords
    const vendorKeywords = [
      /vendor[:. ]*(.*)/i,
      /merchant[:. ]*(.*)/i,
      /payee[:. ]*(.*)/i,
      /store[:. ]*(.*)/i
    ];
    
    // Try to find explicit vendor information
    for (const pattern of vendorKeywords) {
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].trim().length > 0) {
          return match[1].trim();
        }
      }
    }
    
    // Often the vendor name is at the top of the receipt
    // Check the first 3 non-empty lines for a potential business name
    let potentialNames = [];
    let count = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 3 && !/^(date|time|order|invoice|receipt)/i.test(trimmed)) {
        potentialNames.push(trimmed);
        count++;
        if (count >= 3) break;
      }
    }
    
    if (potentialNames.length > 0) {
      // Often the first or second line has the business name
      return potentialNames[0];
    }
    
    return "Unknown Vendor";
  }
  
  /**
   * Extract location information
   */
  private static extractLocation(text: string): string {
    // Different address patterns
    const addressPatterns = [
      // Street address
      /\b\d+\s+[a-z\s]+(?:st(?:reet)?|ave(?:nue)?|rd|road|blvd|boulevard|dr(?:ive)?|ln|lane|way|place|plaza|square)\b/i,
      
      // City, State ZIP pattern
      /\b[a-z\s]+,\s*[a-z]{2}\s+\d{5}(?:-\d{4})?\b/i,
      
      // Address with keywords
      /(?:address|location|store|branch)[:. ]*(.*)/i
    ];
    
    for (const pattern of addressPatterns) {
      const match = text.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    return "";
  }
}