import { OptimizationMetrics, ProcessedReceipt } from '../../state/ocr/types';
import { AIClassifiedReceipt } from '../../types/ReceiptInterfaces';
// Types for service
interface OCRProgressCallback {
  (progress: number, operation?: string): void;
}

interface OCRProcessingOptions {
  onProgress?: OCRProgressCallback;
  signal?: AbortSignal;
  retryAttempts?: number;
  timeout?: number;
}

interface ImageOptimizationResult {
  optimizedUri: string;
  metrics: OptimizationMetrics;
}

interface OCRResult {
  text: string;
  confidence: number;
  boundingBoxes?: any[];
}

class OCRProcessingServiceClass {
  private currentAbortController?: AbortController;
  private readonly API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  private readonly DEFAULT_TIMEOUT = 30000; // 30 seconds

  /**
   * Main processing method - orchestrates the entire OCR workflow
   */
  async processImage(
    imageUri: string,
    options: OCRProcessingOptions = {}
  ): Promise<ProcessedReceipt> {
    const { onProgress, signal, retryAttempts = 2, timeout = this.DEFAULT_TIMEOUT } = options;

    // Create abort controller if not provided
    this.currentAbortController = new AbortController();
    const combinedSignal = signal
      ? this.combineSignals([signal, this.currentAbortController.signal])
      : this.currentAbortController.signal;

    try {
      onProgress?.(0.05, 'Starting image processing...');

      // Step 1: Optimize image (5% - 25%)
      const optimizationResult = await this.optimizeImage(imageUri, {
        signal: combinedSignal,
        onProgress: progress => onProgress?.(0.05 + progress * 0.2, 'Optimizing image...'),
      });

      onProgress?.(0.25, 'Image optimization complete');

      // Step 2: Upload optimized image (25% - 40%)
      const uploadResult = await this.uploadImage(optimizationResult.optimizedUri, {
        signal: combinedSignal,
        onProgress: progress => onProgress?.(0.25 + progress * 0.15, 'Uploading image...'),
      });

      onProgress?.(0.4, 'Upload complete');

      // Step 3: Perform OCR (40% - 70%)
      const ocrResult = await this.performOCR(uploadResult.jobId, {
        signal: combinedSignal,
        timeout,
        retryAttempts,
        onProgress: progress => onProgress?.(0.4 + progress * 0.3, 'Extracting text...'),
      });

      onProgress?.(0.7, 'Text extraction complete');

      // Step 4: Extract structured data (70% - 90%)
      const extractedData = await this.extractReceiptData(ocrResult, {
        signal: combinedSignal,
        onProgress: progress => onProgress?.(0.7 + progress * 0.2, 'Extracting receipt data...'),
      });

      onProgress?.(0.9, 'Data extraction complete');

      // Step 5: Classify receipt (90% - 100%)
      const classifiedReceipt = await this.classifyReceipt(extractedData, {
        signal: combinedSignal,
        onProgress: progress => onProgress?.(0.9 + progress * 0.1, 'Classifying receipt...'),
      });

      onProgress?.(1.0, 'Processing complete');

      // Combine all results
      const processedReceipt: ProcessedReceipt = {
        imageUri: optimizationResult.optimizedUri,
        originalImageUri: imageUri,
        extractedText: ocrResult.text,
        classification: classifiedReceipt,
        optimizationMetrics: optimizationResult.metrics,
        processedAt: new Date().toISOString(),
        confidence: ocrResult.confidence,
      };

      return processedReceipt;
    } catch (error) {
      if (combinedSignal.aborted) {
        throw new Error('OCR processing was cancelled');
      }

      // Re-throw with more context
      throw new Error(
        `OCR processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      this.currentAbortController = undefined;
    }
  }

  /**
   * Optimize image for better OCR results
   */
  async optimizeImage(
    imageUri: string,
    options: { signal?: AbortSignal; onProgress?: OCRProgressCallback } = {}
  ): Promise<ImageOptimizationResult> {
    const { signal, onProgress } = options;
    const startTime = Date.now();

    try {
      onProgress?.(0, 'Starting optimization...');

      // Create FormData for image upload
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      onProgress?.(0.3, 'Uploading for optimization...');

      const response = await fetch(`${this.API_BASE_URL}/api/ocr/optimize`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.status} ${response.statusText}`);
      }

      onProgress?.(0.7, 'Processing optimization...');

      const result = await response.json();

      onProgress?.(1.0, 'Optimization complete');

      return {
        optimizedUri: result.optimizedImageUri,
        metrics: {
          originalSize: result.originalSize,
          optimizedSize: result.optimizedSize,
          originalDimensions: result.originalDimensions,
          optimizedDimensions: result.optimizedDimensions,
          reductionPercentage: result.reductionPercentage,
          processingTime: Date.now() - startTime,
          format: result.format,
        },
      };
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Image optimization was cancelled');
      }
      throw new Error(
        `Image optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Upload image and get job ID for processing
   */
  private async uploadImage(
    imageUri: string,
    options: { signal?: AbortSignal; onProgress?: OCRProgressCallback } = {}
  ): Promise<{ jobId: string; uploadUrl: string }> {
    const { signal, onProgress } = options;

    try {
      onProgress?.(0, 'Preparing upload...');

      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'receipt.jpg',
      } as any);

      onProgress?.(0.5, 'Uploading...');

      const response = await fetch(`${this.API_BASE_URL}/api/ocr/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        signal,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      onProgress?.(1.0, 'Upload complete');

      return {
        jobId: result.jobId,
        uploadUrl: result.uploadUrl,
      };
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Image upload was cancelled');
      }
      throw new Error(
        `Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Perform OCR processing on uploaded image
   */
  async performOCR(
    jobId: string,
    options: {
      signal?: AbortSignal;
      timeout?: number;
      retryAttempts?: number;
      onProgress?: OCRProgressCallback;
    } = {}
  ): Promise<OCRResult> {
    const { signal, timeout = this.DEFAULT_TIMEOUT, retryAttempts = 2, onProgress } = options;
    let attempt = 0;

    while (attempt <= retryAttempts) {
      try {
        onProgress?.(0, `Processing OCR (attempt ${attempt + 1})...`);

        // Start OCR job
        const startResponse = await fetch(`${this.API_BASE_URL}/api/ocr/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ jobId }),
          signal,
        });

        if (!startResponse.ok) {
          throw new Error(`OCR start failed: ${startResponse.status} ${startResponse.statusText}`);
        }

        onProgress?.(0.2, 'OCR processing started...');

        // Poll for completion
        const result = await this.pollForOCRCompletion(jobId, {
          signal,
          timeout,
          onProgress: progress => onProgress?.(0.2 + progress * 0.8, 'Processing text...'),
        });

        return result;
      } catch (error) {
        attempt++;

        if (signal?.aborted) {
          throw new Error('OCR processing was cancelled');
        }

        if (attempt > retryAttempts) {
          throw new Error(
            `OCR failed after ${retryAttempts + 1} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new Error('OCR processing failed - maximum retries exceeded');
  }

  /**
   * Poll OCR job for completion
   */
  private async pollForOCRCompletion(
    jobId: string,
    options: { signal?: AbortSignal; timeout?: number; onProgress?: OCRProgressCallback }
  ): Promise<OCRResult> {
    const { signal, timeout = this.DEFAULT_TIMEOUT, onProgress } = options;
    const startTime = Date.now();
    const pollInterval = 1000; // 1 second

    while (Date.now() - startTime < timeout) {
      if (signal?.aborted) {
        throw new Error('OCR polling was cancelled');
      }

      try {
        const response = await fetch(`${this.API_BASE_URL}/api/ocr/status/${jobId}`, {
          signal,
        });

        if (!response.ok) {
          throw new Error(`OCR status check failed: ${response.status}`);
        }

        const status = await response.json();

        const progress = Math.min(status.progress || 0, 0.95); // Cap at 95% until complete
        onProgress?.(progress, status.currentOperation || 'Processing...');

        if (status.status === 'completed') {
          onProgress?.(1.0, 'OCR complete');
          return {
            text: status.result.text,
            confidence: status.result.confidence,
            boundingBoxes: status.result.boundingBoxes,
          };
        }

        if (status.status === 'failed') {
          throw new Error(`OCR processing failed: ${status.error || 'Unknown error'}`);
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (signal?.aborted) {
          throw new Error('OCR polling was cancelled');
        }
        throw error;
      }
    }

    throw new Error('OCR processing timed out');
  }

  /**
   * Extract structured receipt data from OCR text
   */
  private async extractReceiptData(
    ocrResult: OCRResult,
    options: { signal?: AbortSignal; onProgress?: OCRProgressCallback } = {}
  ): Promise<any> {
    const { signal, onProgress } = options;

    try {
      onProgress?.(0, 'Extracting receipt data...');

      const response = await fetch(`${this.API_BASE_URL}/api/ocr/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: ocrResult.text,
          boundingBoxes: ocrResult.boundingBoxes,
        }),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Data extraction failed: ${response.status}`);
      }

      onProgress?.(1.0, 'Data extraction complete');
      return await response.json();
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Data extraction was cancelled');
      }
      throw new Error(
        `Data extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Classify receipt using AI
   */
  async classifyReceipt(
    extractedData: any,
    options: { signal?: AbortSignal; onProgress?: OCRProgressCallback } = {}
  ): Promise<AIClassifiedReceipt> {
    const { signal, onProgress } = options;

    try {
      onProgress?.(0, 'Classifying receipt...');

      const response = await fetch(`${this.API_BASE_URL}/api/ocr/classify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(extractedData),
        signal,
      });

      if (!response.ok) {
        throw new Error(`Classification failed: ${response.status}`);
      }

      onProgress?.(1.0, 'Classification complete');
      return await response.json();
    } catch (error) {
      if (signal?.aborted) {
        throw new Error('Receipt classification was cancelled');
      }
      throw new Error(
        `Receipt classification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Cancel current processing
   */
  cancelProcessing(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = undefined;
    }
  }

  /**
   * Combine multiple abort signals
   */
  private combineSignals(signals: AbortSignal[]): AbortSignal {
    const controller = new AbortController();

    for (const signal of signals) {
      if (signal.aborted) {
        controller.abort();
        break;
      }
      signal.addEventListener('abort', () => controller.abort());
    }

    return controller.signal;
  }
}

// Export singleton instance
export const OCRProcessingService = new OCRProcessingServiceClass();
export type { ImageOptimizationResult, OCRProcessingOptions, OCRProgressCallback, OCRResult };
