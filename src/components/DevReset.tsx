// src/components/DevReset.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export const DevReset: React.FC = () => {
  // Only show in development
  if (!__DEV__) return null;

  const resetOnboarding = async () => {
    try {
      await AsyncStorage.multiRemove([
        'onboarding_progress',
        'onboardingCompleted',
        'languageSelected',
        'userLanguage',
      ]);
      Alert.alert('✅ Success', 'Onboarding reset!\n\nRestart the app to see onboarding flow.');
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to reset: ' + error);
    }
  };

  const resetEverything = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('✅ Success', 'Everything cleared!\n\nRestart the app.');
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to clear: ' + error);
    }
  };

  const showStorage = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const items = await AsyncStorage.multiGet(keys);
      const data = items.reduce(
        (acc, [key, value]) => {
          acc[key] = value;
          return acc;
        },
        {} as Record<string, string | null>
      );

      Alert.alert('📱 Current Storage', JSON.stringify(data, null, 2));
    } catch (error) {
      Alert.alert('❌ Error', 'Failed to get storage: ' + error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>DEV</Text>

      <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetOnboarding}>
        <Text style={styles.buttonText}>Reset{'\n'}Onboarding</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.clearButton]} onPress={resetEverything}>
        <Text style={styles.buttonText}>Clear{'\n'}All</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={showStorage}>
        <Text style={styles.buttonText}>Show{'\n'}Data</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 8,
    zIndex: 9999,
    flexDirection: 'row',
    gap: 4,
  },
  title: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginRight: 4,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 4,
    minWidth: 50,
  },
  resetButton: {
    backgroundColor: '#FF9500', // Orange
  },
  clearButton: {
    backgroundColor: '#FF3B30', // Red
  },
  infoButton: {
    backgroundColor: '#007AFF', // Blue
  },
  buttonText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 11,
  },
});
