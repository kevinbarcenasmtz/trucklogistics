// src/security/RateLimiter.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SecurityError } from './ErrorSanitizer';

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockoutUntil?: number;
}

export class RateLimiter {
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 20 * 60 * 1000; // 20 minutes
  private static readonly LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes lockout

  private static getStorageKey(identifier: string): string {
    return `rate_limit_${identifier}`;
  }

  static async checkRateLimit(identifier: string): Promise<void> {
    const now = Date.now();
    const key = this.getStorageKey(identifier);

    try {
      const stored = await AsyncStorage.getItem(key);
      const record: AttemptRecord = stored ? JSON.parse(stored) : { count: 0, firstAttempt: now };

      // Check if currently locked out
      if (record.lockoutUntil && now < record.lockoutUntil) {
        const remainingMinutes = Math.ceil((record.lockoutUntil - now) / 60000);
        throw new SecurityError(
          `Rate limited for ${remainingMinutes} minutes`,
          `Too many failed attempts. Please try again in ${remainingMinutes} minutes.`
        );
      }

      // Reset window if enough time has passed
      if (now - record.firstAttempt > this.WINDOW_MS) {
        record.count = 0;
        record.firstAttempt = now;
        delete record.lockoutUntil;
      }

      // Check if max attempts reached
      if (record.count >= this.MAX_ATTEMPTS) {
        record.lockoutUntil = now + this.LOCKOUT_MS;
        await AsyncStorage.setItem(key, JSON.stringify(record));

        throw new SecurityError(
          'Rate limit exceeded',
          'Too many failed attempts. Account temporarily locked for security.'
        );
      }

      await AsyncStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      console.warn('Rate limiting storage error:', error);
    }
  }

  static async recordFailedAttempt(identifier: string): Promise<void> {
    const now = Date.now();
    const key = this.getStorageKey(identifier);

    try {
      const stored = await AsyncStorage.getItem(key);
      const record: AttemptRecord = stored ? JSON.parse(stored) : { count: 0, firstAttempt: now };

      if (now - record.firstAttempt > this.WINDOW_MS) {
        record.count = 1;
        record.firstAttempt = now;
      } else {
        record.count++;
      }

      await AsyncStorage.setItem(key, JSON.stringify(record));
    } catch (error) {
      console.warn('Failed to record attempt:', error);
    }
  }

  static async clearRateLimit(identifier: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.getStorageKey(identifier));
    } catch (error) {
      console.warn('Failed to clear rate limit:', error);
    }
  }
}
