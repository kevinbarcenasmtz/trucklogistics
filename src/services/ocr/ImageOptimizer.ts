// src/services/ocr/ImageOptimizer.ts

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { OptimizationMetrics } from '../../state/ocr/types';
import { safeArrayAccess } from '../../utils/safeAccess';

/**
 * Image optimization configuration
 */
export interface ImageOptimizationOptions {
  /** Image quality (0-1) */
  quality?: number;
  /** Maximum width in pixels */
  maxWidth?: number;
  /** Maximum height in pixels */
  maxHeight?: number;
  /** Output format */
  format?: 'jpeg' | 'png' | 'webp';
  /** Whether to compress for OCR (prioritize text clarity) */
  optimizeForOCR?: boolean;
  /** Maximum file size in bytes */
  maxFileSize?: number;
}

/**
 * Image optimization result
 */
export interface ImageOptimizationResult {
  /** URI of the optimized image */
  uri: string;
  /** Original image dimensions */
  originalDimensions: { width: number; height: number };
  /** Optimized image dimensions */
  optimizedDimensions: { width: number; height: number };
  /** Size reduction percentage */
  reductionPercentage: number;
}

/**
 * Image validation result
 */
interface ImageValidationResult {
  isValid: boolean;
  width: number;
  height: number;
  size: number;
  format?: string;
  issues: string[];
}

/**
 * Type guard for FileInfo with size property
 */
function hasSize(
  fileInfo: FileSystem.FileInfo
): fileInfo is FileSystem.FileInfo & { size: number } {
  return fileInfo.exists && 'size' in fileInfo;
}

/**
 * ImageOptimizer service for preprocessing images before upload
 * Optimizes images for OCR processing while maintaining text clarity
 */
export class ImageOptimizer {
  private static readonly DEFAULT_OPTIONS: Required<ImageOptimizationOptions> = {
    quality: 0.8,
    maxWidth: 2048,
    maxHeight: 2048,
    format: 'jpeg',
    optimizeForOCR: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  };

  /**
   * Optimize an image for OCR processing
   * @param imageUri URI of the image to optimize
   * @param options Optimization options
   * @returns Promise with optimization result and metrics
   */
  static async optimizeImage(
    imageUri: string,
    options?: ImageOptimizationOptions
  ): Promise<ImageOptimizationResult> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // step 1: Validate the input image
      const validation = await this.validateImage(imageUri);
      if (!validation.isValid) {
        throw new Error(`Image validation failed: ${validation.issues.join(', ')}`);
      }

      // steo 2: Determine optimization strategy
      const strategy = this.determineOptimizationStrategy(validation, config);

      // step 3: Apply optimizations
      const result = await this.applyOptimizations(imageUri, strategy, validation);

      return result;
    } catch (error) {
      console.error('Image optimization failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to optimize image: ${errorMessage}`);
    }
  }

  /**
   * Validate image before processing
   * @param imageUri Image URI to validate
   * @returns Validation result
   */
  private static async validateImage(imageUri: string): Promise<ImageValidationResult> {
    const issues: string[] = [];

    try {
      // check if file exists
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      if (!fileInfo.exists) {
        issues.push('File does not exist');
        return {
          isValid: false,
          width: 0,
          height: 0,
          size: 0,
          issues,
        };
      }

      const fileSize = hasSize(fileInfo) ? fileInfo.size : 0;

      if (fileSize > 50 * 1024 * 1024) {
        issues.push('File too large (>50MB)');
      }

      if (fileSize < 1024) {
        issues.push('File too small (<1KB)');
      }

      // get image dimensions using ImageManipulator
      let width = 0;
      let height = 0;
      let format: string | undefined;

      try {
        // Use ImageManipulator to get image info without processing
        const result = await ImageManipulator.manipulateAsync(
          imageUri,
          [], // No transformations, just get info
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Get actual dimensions from the result
        width = result.width;
        height = result.height;
        format = 'jpeg';
      } catch {
        issues.push('Invalid image format or corrupted file');
      }

      // Check minimum dimensions for OCR
      if (width > 0 && height > 0) {
        if (width < 100 || height < 100) {
          issues.push('Image too small for OCR (minimum 100x100px)');
        }

        // Check maximum dimensions
        if (width > 8000 || height > 8000) {
          issues.push('Image too large (maximum 8000x8000px)');
        }

        // Check aspect ratio (avoid extremely stretched images)
        const aspectRatio = Math.max(width, height) / Math.min(width, height);
        if (aspectRatio > 10) {
          issues.push('Extreme aspect ratio may affect OCR quality');
        }
      }

      return {
        isValid: issues.length === 0,
        width,
        height,
        size: fileSize,
        format,
        issues,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      issues.push(`Validation error: ${errorMessage}`);
      return {
        isValid: false,
        width: 0,
        height: 0,
        size: 0,
        issues,
      };
    }
  }

  /**
   * Determine the best optimization strategy based on image characteristics
   * @param validation Image validation result
   * @param config Optimization configuration
   * @returns Optimization actions to perform
   */
  private static determineOptimizationStrategy(
    validation: ImageValidationResult,
    config: Required<ImageOptimizationOptions>
  ): ImageManipulator.Action[] {
    const actions: ImageManipulator.Action[] = [];

    // Calculate if resizing is needed
    const needsResize = validation.width > config.maxWidth || validation.height > config.maxHeight;

    if (needsResize) {
      // Calculate new dimensions maintaining aspect ratio
      const aspectRatio = validation.width / validation.height;
      let newWidth = Math.min(validation.width, config.maxWidth);
      let newHeight = Math.min(validation.height, config.maxHeight);

      // Adjust to maintain aspect ratio
      if (newWidth / aspectRatio > newHeight) {
        newWidth = newHeight * aspectRatio;
      } else {
        newHeight = newWidth / aspectRatio;
      }

      actions.push({
        resize: {
          width: Math.round(newWidth),
          height: Math.round(newHeight),
        },
      });
    }

    // Apply OCR-specific optimizations
    if (config.optimizeForOCR) {
      // Increase contrast and sharpness for better OCR
      // Note: These may not be available in all expo-image-manipulator versions
      // We'll focus on essential transformations
    }

    return actions;
  }

  /**
   * Apply optimizations to the image
   * @param imageUri Original image URI
   * @param actions ImageManipulator actions to apply
   * @param validation Original image validation result
   * @returns Optimization result
   */
  private static async applyOptimizations(
    imageUri: string,
    actions: ImageManipulator.Action[],
    validation: ImageValidationResult
  ): Promise<ImageOptimizationResult> {
    try {
      // Apply optimizations using ImageManipulator
      const result = await ImageManipulator.manipulateAsync(imageUri, actions, {
        compress: 0.8, // Good balance between quality and size for OCR
        format: ImageManipulator.SaveFormat.JPEG,
        base64: false, // We don't need base64, just the file
      });

      // Get file size information
      const originalInfo = await FileSystem.getInfoAsync(imageUri);
      const optimizedInfo = await FileSystem.getInfoAsync(result.uri);

      const originalSize = hasSize(originalInfo) ? originalInfo.size : 0;
      const optimizedSize = hasSize(optimizedInfo) ? optimizedInfo.size : 0;
      const reductionPercentage =
        originalSize > 0 ? ((originalSize - optimizedSize) / originalSize) * 100 : 0;

      return {
        uri: result.uri,
        originalDimensions: {
          width: validation.width,
          height: validation.height,
        },
        optimizedDimensions: {
          width: result.width,
          height: result.height,
        },
        reductionPercentage: Math.max(0, reductionPercentage),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown manipulation error';
      throw new Error(`Image manipulation failed: ${errorMessage}`);
    }
  }

  /**
   * Create optimization metrics for tracking
   * @param originalUri Original image URI
   * @param result Optimization result
   * @param processingTime Time taken for optimization
   * @returns OptimizationMetrics object
   */
  static async createMetrics(
    originalUri: string,
    result: ImageOptimizationResult,
    processingTime: number
  ): Promise<OptimizationMetrics> {
    const originalInfo = await FileSystem.getInfoAsync(originalUri);
    const optimizedInfo = await FileSystem.getInfoAsync(result.uri);

    return {
      originalSize: hasSize(originalInfo) ? originalInfo.size : 0,
      optimizedSize: hasSize(optimizedInfo) ? optimizedInfo.size : 0,
      originalDimensions: result.originalDimensions,
      optimizedDimensions: result.optimizedDimensions,
      reductionPercentage: result.reductionPercentage,
      processingTime,
      format: 'jpeg',
      compressionRatio:
        result.reductionPercentage > 0 ? (100 - result.reductionPercentage) / 100 : 1.0, // Add this
      qualityScore: 0.8,
    };
  }

  /**
   * Quick validation check for image before processing
   * @param imageUri Image URI to check
   * @returns True if image appears valid for OCR processing
   */
  static async isValidForOCR(imageUri: string): Promise<boolean> {
    try {
      const validation = await this.validateImage(imageUri);
      return validation.isValid;
    } catch {
      return false;
    }
  }

  /**
   * Get estimated processing time based on image characteristics
   * @param imageUri Image URI
   * @returns Estimated processing time in milliseconds
   */
  static async getEstimatedProcessingTime(imageUri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(imageUri);
      const fileSize = hasSize(fileInfo) ? fileInfo.size : 0;

      // Base time: 500ms
      // Additional time based on file size: ~100ms per MB
      const baseTime = 500;
      const sizeTime = (fileSize / (1024 * 1024)) * 100;

      return Math.round(baseTime + sizeTime);
    } catch {
      return 1000; // Default estimate
    }
  }

  /**
   * Clean up temporary optimized images
   * @param imageUri URI of image to delete
   */
  static async cleanup(imageUri: string): Promise<void> {
    try {
      // Only delete if it's a temporary file (contains 'ImageManipulator' in path)
      if (imageUri.includes('ImageManipulator') || imageUri.includes('/tmp/')) {
        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(imageUri);
        }
      }
    } catch {
      // Cleanup errors are not critical - silently fail
    }
  }

  /**
   * Optimize multiple images in batch
   * @param imageUris Array of image URIs
   * @param options Optimization options
   * @param onProgress Progress callback (receives completed count)
   * @returns Array of optimization results
   */
  static async optimizeBatch(
    imageUris: string[],
    options?: ImageOptimizationOptions,
    onProgress?: (completed: number, total: number) => void
  ): Promise<ImageOptimizationResult[]> {
    const results: ImageOptimizationResult[] = [];

    for (let i = 0; i < imageUris.length; i++) {
      try {
        const imageUri = safeArrayAccess(imageUris, i, '');
        if (!imageUri) continue; // Skip if no valid URI
        const result = await this.optimizeImage(imageUri, options);
        results.push(result);

        if (onProgress) {
          onProgress(i + 1, imageUris.length);
        }
      } catch (error) {
        console.error(`Failed to optimize image ${i}:`, error);
        // Continue with other images
      }
    }

    return results;
  }
}

/**
 * Default export for convenience
 */
export default ImageOptimizer;
