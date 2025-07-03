// src/services/OcrService.ts
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

// Get API URL from environment variables or constants
const API_URL = Constants.expoConfig?.extra?.ocrApiUrl || process.env.EXPO_PUBLIC_OCR_API_URL;

export class OcrService {
  /**
   * Uploads an image to the backend for OCR processing
   * @param imageUri Local URI of the image
   * @returns Promise containing recognized text
   */
  static async recognizeText(imageUri: string): Promise<string> {
    try {
      // Convert image to base64
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Format for sending to server
      const imageData = `data:image/jpeg;base64,${base64}`;

      // Prepare headers with auth if available
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add API key to headers if available
      // if (API_KEY) {
      //   headers['Authorization'] = `Bearer ${API_KEY}`;
      // }

      // Send to backend
      const response = await fetch(`${API_URL}/api/ocr/base64`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          image: imageData,
        }),
      });

      if (!response.ok) {
        throw new Error(`OCR service error: ${response.status}`);
      }

      const result = await response.json();
      return result.text;
    } catch (error) {
      console.error('Error in OCR processing:', error);
      throw error;
    }
  }
}
