// src/utils/correlation.ts

import { safeParseInt, safeString } from '@/src/utils/safeAccess';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Generates a unique correlation ID for request tracking
 * Format: <platform>-<device>-<timestamp>-<random>
 * Example: ios-iPhone14-1704067200000-a1b2c3d4
 */
export function generateCorrelationId(): string {
  const platform = Platform.OS;
  const device = getDeviceIdentifier();
  const timestamp = Date.now();
  const random = generateRandomString(8);

  return `${platform}-${device}-${timestamp}-${random}`;
}

/**
 * Generates a shorter correlation ID for display purposes
 * Format: <timestamp>-<random>
 * Example: 1704067200000-a1b2c3d4
 */
export function generateShortCorrelationId(): string {
  const timestamp = Date.now();
  const random = generateRandomString(8);

  return `${timestamp}-${random}`;
}

/**
 * Extracts timestamp from a correlation ID
 */
export function getTimestampFromCorrelationId(correlationId: string): number | null {
  const parts = correlationId.split('-');

  // handle both long and short formats
  const timestampPart = parts.length >= 4 ? parts[2] : parts[0];
  const timestamp = safeParseInt(timestampPart);

  return isNaN(timestamp) ? null : timestamp;
}

/**
 * Validates if a string is a valid correlation ID
 */
export function isValidCorrelationId(correlationId: string): boolean {
  if (!correlationId || typeof correlationId !== 'string') {
    return false;
  }

  const parts = correlationId.split('-');
  if (parts.length !== 4) {
    return false;
  }

  const [platform, device, timestamp, random] = parts;

  // Validate each part exists and has correct format
  const isValidPlatform = ['ios', 'android', 'web'].includes(safeString(platform));
  const isValidDevice = safeString(device).length > 0;
  const isValidTimestamp = !isNaN(safeParseInt(timestamp));
  const isValidRandom = safeString(random).length >= 8;

  return isValidPlatform && isValidDevice && isValidTimestamp && isValidRandom;
}

/**
 * gets a device identifier for correlation ID
 */
function getDeviceIdentifier(): string {
  try {
    // try to get device model
    if (Constants.platform?.ios?.modelName) {
      return Constants.platform.ios.modelName.replace(/\s+/g, '');
    }

    if (Constants.platform?.android?.model) {
      return Constants.platform.android.model.replace(/\s+/g, '');
    }

    // fallback to device name
    if (Constants.deviceName) {
      return Constants.deviceName.replace(/\s+/g, '').substring(0, 20);
    }

    // final fallback
    return 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Generates a random alphanumeric string
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Creates a correlation ID header object for requests
 */
export function createCorrelationHeader(correlationId?: string): Record<string, string> {
  return {
    'X-Correlation-ID': correlationId || generateCorrelationId(),
  };
}

/**
 * Extracts correlation ID from response headers
 */
export function extractCorrelationId(headers: Headers | Record<string, string>): string | null {
  if (headers instanceof Headers) {
    return headers.get('x-correlation-id') || headers.get('X-Correlation-ID');
  }

  return headers['x-correlation-id'] || headers['X-Correlation-ID'] || null;
}

/**
 * Formats correlation ID for logging
 */
export function formatCorrelationId(correlationId: string): string {
  const timestamp = getTimestampFromCorrelationId(correlationId);

  if (timestamp) {
    const date = new Date(timestamp);
    const time = date.toLocaleTimeString();
    const parts = correlationId.split('-');
    const shortId = parts[parts.length - 1];

    return `[${time} ${shortId}]`;
  }

  return `[${correlationId.substring(0, 12)}...]`;
}

/**
 * Correlation ID manager for maintaining ID across app lifecycle
 */
class CorrelationIdManager {
  private static instance: CorrelationIdManager;
  private sessionId: string;

  private constructor() {
    this.sessionId = generateCorrelationId();
  }

  static getInstance(): CorrelationIdManager {
    if (!CorrelationIdManager.instance) {
      CorrelationIdManager.instance = new CorrelationIdManager();
    }
    return CorrelationIdManager.instance;
  }

  /**
   * Get the current session correlation ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Generate a new session ID
   */
  regenerateSessionId(): string {
    this.sessionId = generateCorrelationId();
    return this.sessionId;
  }

  /**
   * Create a child correlation ID linked to the session
   */
  createChildId(): string {
    const random = generateRandomString(6);
    return `${this.sessionId}-${random}`;
  }
}

export const correlationIdManager = CorrelationIdManager.getInstance();

/**
 * React Native specific utilities
 */
export const CorrelationUtils = {
  /**
   * Attach correlation ID to all console methods in development
   */
  enableCorrelationLogging: () => {
    if (__DEV__) {
      const originalLog = console.log;
      const originalError = console.error;
      const originalWarn = console.warn;

      console.log = (...args) => {
        const id = formatCorrelationId(correlationIdManager.getSessionId());
        originalLog(id, ...args);
      };

      console.error = (...args) => {
        const id = formatCorrelationId(correlationIdManager.getSessionId());
        originalError(id, ...args);
      };

      console.warn = (...args) => {
        const id = formatCorrelationId(correlationIdManager.getSessionId());
        originalWarn(id, ...args);
      };
    }
  },

  /**
   * Create a tagged logger for a specific correlation ID
   */
  createLogger: (correlationId: string) => {
    const tag = formatCorrelationId(correlationId);

    return {
      log: (...args: any[]) => console.log(tag, ...args),
      error: (...args: any[]) => console.error(tag, ...args),
      warn: (...args: any[]) => console.warn(tag, ...args),
      info: (...args: any[]) => console.log(tag, '[INFO]', ...args),
      debug: (...args: any[]) => {
        if (__DEV__) {
          console.log(tag, '[DEBUG]', ...args);
        }
      },
    };
  },
};

/**
 * Export types
 */
export type CorrelationId = string;
export type CorrelationLogger = ReturnType<typeof CorrelationUtils.createLogger>;
