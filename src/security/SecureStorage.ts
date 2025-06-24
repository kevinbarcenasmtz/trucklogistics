// src/security/SecureStorage.ts
import * as Keychain from 'react-native-keychain';

export class SecureStorage {
  private static readonly SERVICE_NAME = 'TruckLogisticsAuth';
  private static readonly USERNAME = 'auth_token';

  static async storeAuthToken(token: string): Promise<void> {
    try {
      // Try with biometric protection first
      await Keychain.setInternetCredentials(this.SERVICE_NAME, this.USERNAME, token, {
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.warn('Biometric storage failed, using standard keychain:', error);
      // Fallback to standard secure storage without biometrics
      await Keychain.setInternetCredentials(this.SERVICE_NAME, this.USERNAME, token);
    }
  }

  static async getAuthToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.SERVICE_NAME);
      return credentials ? credentials.password : null;
    } catch (error) {
      console.warn('Failed to retrieve auth token:', error);
      return null;
    }
  }

  static async removeAuthToken(): Promise<void> {
    try {
      await Keychain.resetInternetCredentials({ server: this.SERVICE_NAME });
    } catch (error) {
      console.warn('Failed to remove auth token:', error);
    }
  }

  static async hasAuthToken(): Promise<boolean> {
    try {
      const token = await this.getAuthToken();
      return token !== null;
    } catch (error) {
      return false;
    }
  }
}
