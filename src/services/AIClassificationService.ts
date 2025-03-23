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
    console.log('[AIClassificationService] Initializing Anthropic client');
    
    if (!this.API_KEY || this.API_KEY.trim() === '') {
      console.warn('[AIClassificationService] API key not configured. Check your environment variables.');
      return null;
    }
    
    console.log('[AIClassificationService] API key found, creating client');
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
    console.log('[AIClassificationService] Starting classification of receipt text');
    console.log(`[AIClassificationService] Text length: ${extractedText.length} characters`);
    
    // Skip API call if text is too short
    if (extractedText.length < 10) {
      console.log('[AIClassificationService] Text too short - using fallback classification method');
      return this.fallbackClassification(extractedText);
    }

    const client = this.getClient();
    
    // If no client (no API key), use fallback
    if (!client) {
      console.log('[AIClassificationService] No API client available - using fallback classification method');
      return this.fallbackClassification(extractedText);
    }

    try {
      console.log('[AIClassificationService] Sending request to Anthropic API');
      console.log(`[AIClassificationService] Using model: ${this.MODEL}`);
      
      console.log(`[AIClassificationService] Using model: ${this.MODEL}`);
      
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
      
      console.log('[AIClassificationService] Successfully received API response');

      console.log('[AIClassificationService] Received response from Anthropic API');
      
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
      
      console.log('[AIClassificationService] Extracted text content from response');
      
      // Try to parse JSON from the text response
      try {
        console.log('[AIClassificationService] Attempting to parse JSON from response');
        // Find JSON in the text (Claude sometimes wraps JSON in markdown)
        const jsonMatch = textContent.match(/```json\s*([\s\S]*?)\s*```/) || 
                         textContent.match(/```\s*([\s\S]*?)\s*```/) ||
                         textContent.match(/{[\s\S]*?}/);
        
        console.log(`[AIClassificationService] JSON match found: ${!!jsonMatch}`);
                         
        const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : textContent;
        console.log(`[AIClassificationService] Extracted JSON string: ${jsonStr.substring(0, 50)}...`);
        
        const parsedResult = JSON.parse(jsonStr.replace(/```/g, '').trim());
        console.log('[AIClassificationService] Successfully parsed JSON result', parsedResult);
        
        // Ensure all required fields exist with defaults if needed
        const result = {
          date: parsedResult.date || new Date().toISOString().split('T')[0],
          type: this.validateReceiptType(parsedResult.type),
          amount: this.formatAmount(parsedResult.amount),
          vehicle: parsedResult.vehicle || 'Unknown Vehicle',
          vendorName: parsedResult.vendorName || 'Unknown Vendor',
          location: parsedResult.location || '',
          confidence: 0.85
        };
        
        console.log('[AIClassificationService] Final classified result:', result);
        return result;
      } catch (parseError) {
        console.error('[AIClassificationService] Failed to parse Claude JSON response:', parseError);
        console.log('[AIClassificationService] Raw response text:', textContent);
        return this.fallbackClassification(extractedText);
      }
    } catch (error) {
      console.error('[AIClassificationService] API error:', error);
      console.log('[AIClassificationService] Using fallback classification method due to API error');
      return this.fallbackClassification(extractedText);
    }
  }
  
  /**
   * Validate and normalize receipt type
   */
  private static validateReceiptType(type?: string): 'Fuel' | 'Maintenance' | 'Other' {
    console.log(`[AIClassificationService] Validating receipt type: "${type}"`);
    
    if (!type) {
      console.log('[AIClassificationService] No type provided, defaulting to "Other"');
      return 'Other';
    }
    
    const normalizedType = type.trim().toLowerCase();
    console.log(`[AIClassificationService] Normalized type: "${normalizedType}"`);
    
    if (['fuel', 'gas', 'diesel'].includes(normalizedType)) {
      console.log('[AIClassificationService] Classified as Fuel type');
      return 'Fuel';
    } else if (['maintenance', 'repair', 'service'].includes(normalizedType)) {
      console.log('[AIClassificationService] Classified as Maintenance type');
      return 'Maintenance';
    } else {
      console.log('[AIClassificationService] Classified as Other type');
      return 'Other';
    }
  }
  
  /**
   * Format amount to ensure consistent format
   */
  private static formatAmount(amount: any): string {
    console.log(`[AIClassificationService] Formatting amount: "${amount}" (type: ${typeof amount})`);
    
    // Handle null or undefined
    if (amount === null || amount === undefined) {
      console.log('[AIClassificationService] Amount is null or undefined, defaulting to "$0.00"');
      return '$0.00';
    }
    
    // If amount is already a number, format it directly
    if (typeof amount === 'number') {
      const formattedAmount = `$${amount.toFixed(2)}`;
      console.log(`[AIClassificationService] Formatted number amount: "${formattedAmount}"`);
      return formattedAmount;
    }
    
    // Convert to string to be safe
    const amountStr = String(amount);
    
    // If it already has a currency symbol, clean it up
    if (amountStr.includes('$') || amountStr.includes('€') || amountStr.includes('£')) {
      console.log('[AIClassificationService] Amount already has currency symbol, cleaning up');
      // Remove spaces between currency symbol and amount
      const cleanedAmount = amountStr.replace(/([€£$])\s+/g, '$1');
      console.log(`[AIClassificationService] Cleaned amount: "${cleanedAmount}"`);
      return cleanedAmount;
    }
    
    // Try to parse as a number and format
    console.log('[AIClassificationService] Parsing amount as number');
    const amountNum = parseFloat(amountStr.replace(/,/g, ''));
    
    if (isNaN(amountNum)) {
      console.log('[AIClassificationService] Amount is not a valid number, defaulting to "$0.00"');
      return '$0.00';
    }
    
    const formattedAmount = `$${amountNum.toFixed(2)}`;
    console.log(`[AIClassificationService] Formatted amount: "${formattedAmount}"`);
    return formattedAmount;
  }
    
  /**
   * Fallback method to classify text if the API call fails
   */
  private static fallbackClassification(text: string): AIClassifiedReceipt {
    console.log('[AIClassificationService] Running fallback classification for text');
    
    const date = this.extractDate(text);
    const type = this.determineReceiptType(text);
    const amount = this.extractAmount(text);
    const vehicle = this.extractVehicle(text);
    const vendorName = this.extractVendorName(text);
    const location = this.extractLocation(text);
    
    console.log('[AIClassificationService] Fallback classification results:', {
      date, type, amount, vehicle, vendorName, location
    });
    
    return {
      date,
      type,
      amount,
      vehicle,
      vendorName,
      location,
      confidence: 0.6 // Lower confidence for fallback method
    };
  }
  
  /**
   * Extract date from text
   */
  private static extractDate(text: string): string {
    console.log('[AIClassificationService] Extracting date from text');
    
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

    for (let i = 0; i < datePatterns.length; i++) {
      const pattern = datePatterns[i];
      const match = text.match(pattern);
      if (match && match[0]) {
        console.log(`[AIClassificationService] Date found with pattern ${i+1}: "${match[0]}"`);
        return match[0];
      }
    }
    
    // Date with keywords
    console.log('[AIClassificationService] No standard date format found, trying keyword patterns');
    const dateKeywordPattern = /(?:date|issued|purchased)(?:\s*:\s*|\s+)([0-9]{1,2}[\/\-][0-9]{1,2}[\/\-][0-9]{2,4})/i;
    const keywordMatch = text.match(dateKeywordPattern);
    if (keywordMatch && keywordMatch[1]) {
      console.log(`[AIClassificationService] Date found with keyword pattern: "${keywordMatch[1]}"`);
      return keywordMatch[1];
    }
    
    // Default to current date if not found
    const defaultDate = new Date().toISOString().split('T')[0];
    console.log(`[AIClassificationService] No date found, defaulting to current date: "${defaultDate}"`);
    return defaultDate;
  }
  
  /**
   * Extract amount from text
   */
  private static extractAmount(text: string): string {
    console.log('[AIClassificationService] Extracting amount from text');
    
    // Look for currency amounts
    const amountRegex = /\$\s*\d+(?:,\d{3})*(?:\.\d{2})?|\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP)/g;
    const matches = text.match(amountRegex);
    
    if (matches && matches.length > 0) {
      console.log(`[AIClassificationService] Found ${matches.length} potential amounts:`, matches);
      
      // Find the largest amount, which is likely the total
      let largestAmount = 0;
      let largestAmountStr = '';
      
      for (const match of matches) {
        const numStr = match.replace(/[$,USD€£\s]/g, '');
        const num = parseFloat(numStr);
        console.log(`[AIClassificationService] Parsed amount "${match}" as ${num}`);
        
        if (!isNaN(num) && num > largestAmount) {
          largestAmount = num;
          largestAmountStr = match;
          console.log(`[AIClassificationService] New largest amount: ${largestAmountStr} (${largestAmount})`);
        }
      }
      
      if (largestAmountStr) {
        console.log(`[AIClassificationService] Selected final amount: "${largestAmountStr}"`);
        return largestAmountStr;
      }
    }
    
    // Try with keywords
    console.log('[AIClassificationService] No direct amounts found, trying keyword patterns');
    const totalRegex = /(?:total|amount|due|balance|payment)[^0-9]*?(\$?\s*\d+(?:,\d{3})*(?:\.\d{2})?)/i;
    const totalMatch = text.match(totalRegex);
    
    if (totalMatch && totalMatch[1]) {
      console.log(`[AIClassificationService] Amount found with keyword pattern: "${totalMatch[1]}"`);
      return totalMatch[1].trim();
    }
    
    console.log('[AIClassificationService] No amount found, defaulting to "$0.00"');
    return "$0.00";
  }
  
  /**
   * Determine receipt type based on keywords
   */
  private static determineReceiptType(text: string): 'Fuel' | 'Maintenance' | 'Other' {
    console.log('[AIClassificationService] Determining receipt type from text');
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
        console.log(`[AIClassificationService] Found fuel keyword: "${keyword}"`);
        return 'Fuel';
      }
    }
    
    // Check for maintenance keywords
    for (const keyword of maintenanceKeywords) {
      if (lowerText.includes(keyword)) {
        console.log(`[AIClassificationService] Found maintenance keyword: "${keyword}"`);
        return 'Maintenance';
      }
    }
    
    // Default
    console.log('[AIClassificationService] No type-specific keywords found, defaulting to "Other"');
    return 'Other';
  }
  
  /**
   * Extract vehicle information
   */
  private static extractVehicle(text: string): string {
    console.log('[AIClassificationService] Extracting vehicle information from text');
    
    // Regular expressions for vehicle identification
    const patterns = [
      // Vehicle ID, Unit #, Truck #, etc.
      /(?:vehicle|truck|car|unit|veh|fleet|equip(?:ment)?)\s*(?:id|number|no|#|code)?[:. ]*([a-z0-9-]{1,10})/i,
      // VIN (Vehicle Identification Number)
      /VIN[:. ]*([A-Z0-9]{6,17})/i,
      // License plate
      /(?:license|plate|reg(?:istration)?)\s*(?:no|#|number)?[:. ]*([A-Z0-9]{5,10})/i
    ];
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = text.match(pattern);
      if (match && match[1]) {
        const vehicle = `Truck ${match[1].toUpperCase()}`;
        console.log(`[AIClassificationService] Vehicle found with pattern ${i+1}: "${vehicle}"`);
        return vehicle;
      }
    }
    
    // Look for make/model patterns
    console.log('[AIClassificationService] No vehicle ID found, looking for make/model');
    const makeModelPattern = /(ford|chevy|chevrolet|dodge|gmc|freightliner|peterbilt|kenworth|volvo|international|mack)\s+([a-z0-9-]+)/i;
    const makeModelMatch = text.match(makeModelPattern);
    
    if (makeModelMatch && makeModelMatch[1] && makeModelMatch[2]) {
      const make = makeModelMatch[1].charAt(0).toUpperCase() + makeModelMatch[1].slice(1);
      const model = makeModelMatch[2].toUpperCase();
      const vehicle = `${make} ${model}`;
      console.log(`[AIClassificationService] Vehicle make/model found: "${vehicle}"`);
      return vehicle;
    }
    
    // Default
    console.log('[AIClassificationService] No vehicle information found, defaulting to "Unknown Vehicle"');
    return "Unknown Vehicle";
  }
  
  /**
   * Extract vendor name from receipt
   */
  private static extractVendorName(text: string): string {
    console.log('[AIClassificationService] Extracting vendor name from text');
    const lines = text.split('\n');
    console.log(`[AIClassificationService] Text split into ${lines.length} lines`);
    
    // Common vendor keywords
    const vendorKeywords = [
      /vendor[:. ]*(.*)/i,
      /merchant[:. ]*(.*)/i,
      /payee[:. ]*(.*)/i,
      /store[:. ]*(.*)/i
    ];
    
    // Try to find explicit vendor information
    for (let i = 0; i < vendorKeywords.length; i++) {
      const pattern = vendorKeywords[i];
      for (const line of lines) {
        const match = line.match(pattern);
        if (match && match[1] && match[1].trim().length > 0) {
          const vendor = match[1].trim();
          console.log(`[AIClassificationService] Vendor found with keyword pattern ${i+1}: "${vendor}"`);
          return vendor;
        }
      }
    }
    
    // Often the vendor name is at the top of the receipt
    console.log('[AIClassificationService] No vendor keyword found, checking first lines');
    
    // Check the first 3 non-empty lines for a potential business name
    let potentialNames = [];
    let count = 0;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 3 && !/^(date|time|order|invoice|receipt)/i.test(trimmed)) {
        console.log(`[AIClassificationService] Potential vendor name found: "${trimmed}"`);
        potentialNames.push(trimmed);
        count++;
        if (count >= 3) break;
      }
    }
    
    if (potentialNames.length > 0) {
      // Often the first or second line has the business name
      console.log(`[AIClassificationService] Selected vendor name: "${potentialNames[0]}"`);
      return potentialNames[0];
    }
    
    console.log('[AIClassificationService] No vendor name found, defaulting to "Unknown Vendor"');
    return "Unknown Vendor";
  }
  
  /**
   * Extract location information
   */
  private static extractLocation(text: string): string {
    console.log('[AIClassificationService] Extracting location information from text');
    
    // Different address patterns
    const addressPatterns = [
      // Street address
      /\b\d+\s+[a-z\s]+(?:st(?:reet)?|ave(?:nue)?|rd|road|blvd|boulevard|dr(?:ive)?|ln|lane|way|place|plaza|square)\b/i,
      
      // City, State ZIP pattern
      /\b[a-z\s]+,\s*[a-z]{2}\s+\d{5}(?:-\d{4})?\b/i,
      
      // Address with keywords
      /(?:address|location|store|branch)[:. ]*(.*)/i
    ];
    
    for (let i = 0; i < addressPatterns.length; i++) {
      const pattern = addressPatterns[i];
      const match = text.match(pattern);
      if (match) {
        console.log(`[AIClassificationService] Location found with pattern ${i+1}: "${match[0]}"`);
        return match[0];
      }
    }
    
    console.log('[AIClassificationService] No location information found');
    return "";
  }
}