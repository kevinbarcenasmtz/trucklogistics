// app/(app)/camera/index.tsx
import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from "@/src/theme";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { ActionButton } from '@/src/components/camera/CameraUIComponents';

export default function CameraScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const { t } = useTranslation();
  
  // Use useCameraPermissions hook for camera permissions
  const [cameraPermissionStatus, requestCameraPermission] = ImagePicker.useCameraPermissions();

  // Handle selecting image from library
  const handleSelectImage = async () => {
    try {
      // Provide haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (err) {
        console.warn('Haptic feedback not supported:', err);
      }
      
      // Launch image library with the updated MediaType string value instead of enum
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // Use string value instead of deprecated enum
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });
      
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image selection error:", error);
      Alert.alert(
        t('error', 'Error'), 
        t('imageSelectionError', 'Failed to select image. Please try again.')
      );
    }
  };

  // Handle taking a photo with the camera
  const handleOpenCamera = async () => {
    try {
      // Provide haptic feedback
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (err) {
        console.warn('Haptic feedback not supported:', err);
      }
      
      // Check if we need to request camera permissions
      if (!cameraPermissionStatus?.granted) {
        const permissionResult = await requestCameraPermission();
        if (!permissionResult.granted) {
          Alert.alert(
            t('permissionRequired', 'Permission Required'),
            t('cameraPermissionMessage', 'This app needs camera access to scan receipts and documents')
          );
          return;
        }
      }

      // Launch camera 
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Camera error:", error);
      Alert.alert(
        t('error', 'Error'),
        t('cameraError', 'Failed to open camera. Please try again.')
      );
    }
  };

  // Handle processing the selected image
  const handleProcess = () => {
    if (selectedImage) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (err) {
        console.warn('Haptic feedback not supported:', err);
      }
      
      router.push({ 
        pathname: "/camera/imagedetails", 
        params: { uri: selectedImage }
      });
    }
  };

  // Handle retaking/reselecting an image
  const handleRetake = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.warn('Haptic feedback not supported:', err);
    }
    
    setSelectedImage(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.colors.black_grey }]}>
      {selectedImage ? (
        // Show selected image and process button
        <>
          <Image
            source={{ uri: selectedImage }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <TouchableOpacity 
            onPress={handleRetake} 
            style={[
              styles.retakeButton,
              { backgroundColor: themeStyles.colors.greenThemeColor }
            ]}
          >
            <MaterialIcons name="refresh" size={24} color={themeStyles.colors.white} />
          </TouchableOpacity>
          
          <View style={styles.buttonContainer}>
            <ActionButton
              title={t('processImage', 'Process Image')}
              icon="arrow-forward"
              onPress={handleProcess}
              backgroundColor={themeStyles.colors.greenThemeColor}
              style={styles.processImage}
            />
          </View>
        </>
      ) : (
        // Show camera and gallery options
        <View style={styles.bottomButtonsContainer}>
          <View style={styles.instructionContainer}>
            <MaterialIcons 
              name="receipt" 
              size={40} 
              color={themeStyles.colors.greenThemeColor} 
            />
            <Text style={[
              styles.instructionText,
              { color: themeStyles.colors.white }
            ]}>
              {t('selectOrTakePhoto', 'Take a photo of your receipt or select from your photo library')}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <ActionButton 
              title={t('openCamera', 'Open Camera')}
              icon="camera-alt"
              onPress={handleOpenCamera}
              backgroundColor={themeStyles.colors.greenThemeColor}
              style={styles.actionButton}
            />
            
            <ActionButton 
              title={t('gallery', 'Gallery')}
              icon="photo-library"
              onPress={handleSelectImage}
              backgroundColor={themeStyles.colors.greenThemeColor}
              style={styles.actionButton}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionContainer: {
    alignItems: 'center',
    marginBottom: verticalScale(30),
    paddingHorizontal: horizontalScale(20),
  },
  instructionText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(16),
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    paddingHorizontal: horizontalScale(10),
    justifyContent: 'space-between',
    gap: horizontalScale(16),
  },
  actionButton: {
    flex: 1,
    marginHorizontal: horizontalScale(10),
  },
  imagePreview: {
    width: '100%',
    height: '50%',
    marginTop: verticalScale(50),
  },
  buttonContainer: {
    position: 'absolute',
    bottom: verticalScale(120),
    width: '80%',
    alignItems: 'center',
  },
  processImage: {
    width: '100%',
  },
  retakeButton: {
    position: 'absolute',
    top: verticalScale(60),
    right: horizontalScale(20),
    padding: moderateScale(10),
    borderRadius: moderateScale(20),
    zIndex: 999,
  },
  bottomButtonsContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(10),
    paddingBottom: verticalScale(100),
  },
});