// app/(app)/camera/index.tsx
import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from "@/src/theme";
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

export default function CameraScreen() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const router = useRouter();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const { t } = useTranslation();

  const handleSelectImage = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 5],
        quality: 1,
      });
      
      if (!result.canceled) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Image selection error:", error);
    }
  };

  const handleOpenCamera = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert(t('cameraPermission', 'Camera permission is required'));
        return;
      }

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
    }
  };

  const handleProcess = () => {
    if (selectedImage) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push({ pathname: "/camera/imagedetails", params: { uri: selectedImage }});
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.colors.black_grey }]}>
      {selectedImage ? (
        <>
          <Image
            source={{ uri: selectedImage }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <TouchableOpacity 
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedImage(null);
            }} 
            style={[
              styles.retakeButton,
              { backgroundColor: themeStyles.colors.greenThemeColor }
            ]}
          >
            <MaterialIcons name="refresh" size={24} color={themeStyles.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleProcess} 
            style={[
              styles.processImage,
              { 
                backgroundColor: themeStyles.colors.greenThemeColor,
                ...themeStyles.shadow.md
              }
            ]}
          >
            <Text style={[styles.buttonText, { color: themeStyles.colors.white }]}>
              {t('processImage', 'Process Image')}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity 
            onPress={handleOpenCamera} 
            style={[
              styles.button,
              { 
                backgroundColor: themeStyles.colors.greenThemeColor,
                ...themeStyles.shadow.sm 
              }
            ]}
          >
            <MaterialIcons name="camera-alt" size={24} color={themeStyles.colors.white} />
            <Text style={[styles.buttonText, { color: themeStyles.colors.white }]}>
              {t('openCamera', 'Open Camera')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleSelectImage} 
            style={[
              styles.button,
              { 
                backgroundColor: themeStyles.colors.greenThemeColor,
                ...themeStyles.shadow.sm 
              }
            ]}
          >
            <MaterialIcons name="photo-library" size={24} color={themeStyles.colors.white} />
            <Text style={[styles.buttonText, { color: themeStyles.colors.white }]}>
              {t('openPhotoLibrary', 'Open Photo Library')}
            </Text>
          </TouchableOpacity>
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
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
    marginHorizontal: horizontalScale(10),
    flex: 1,
  },
  imagePreview: {
    width: '100%',
    height: '50%',
    marginTop: verticalScale(50),
  },
  processImage: {
    position: 'absolute',
    bottom: verticalScale(120),
    padding: moderateScale(15),
    borderRadius: moderateScale(10),
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    zIndex: 999,
  },
  retakeButton: {
    position: 'absolute',
    top: verticalScale(60),
    right: horizontalScale(20),
    padding: moderateScale(10),
    borderRadius: moderateScale(20),
    zIndex: 999,
  },
  buttonText: {
    fontWeight: 'bold',
    marginLeft: horizontalScale(10),
  },
  bottomButtonsContainer: {
    position: 'absolute',
    bottom: verticalScale(130),
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: horizontalScale(10),
  },
});