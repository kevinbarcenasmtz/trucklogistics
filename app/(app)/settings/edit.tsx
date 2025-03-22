// app/(app)/settings/edit.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert,
  ScrollView, SafeAreaView, ActivityIndicator
} from "react-native";
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import FormButton from "@/src/components/forms/FormButton";
import { useRouter } from "expo-router";
import { useAuth } from "@/src/context/AuthContext";
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

interface UserData {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  country: string;
  city: string;
  state: string;
}

export default function EditScreen() {
  const router = useRouter();
  const { user, userData: initialUserData, updateUserData } = useAuth();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialUserData) {
      setUserData(initialUserData);
    } else {
      setIsLoading(true);
      // Load user data if not already available through context
      getUser();
    }
  }, [initialUserData]);

  const getUser = async () => {
    if (!user) return;
    try {
      // Implement your user data fetching logic here
      // This should be adapted to how your Auth context works
      setIsLoading(false);
    } catch (error) {
      console.log('Error fetching user data:', error);
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!user) return;
    
    await Haptics.selectionAsync();
    setIsSaving(true);
  
    try {
      // Check if you have an updateUserData function in your Auth context
      if (typeof updateUserData === 'function') {
        await updateUserData({
          fname: userData?.fname || '',
          lname: userData?.lname || '',
          phone: userData?.phone || '',
          email: userData?.email || '',
          country: userData?.country || '',
          city: userData?.city || '',
          state: userData?.state || '',
        });
      } else {
        // Fallback implementation if not available in context
        // Implement your user data update logic here
      }
  
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', t('profileUpdated', 'Your profile has been updated successfully.'));
      router.back();
    } catch (error) {
      console.log('Error updating user profile:', error);
      Alert.alert('Error', t('updateFailed', 'Something went wrong while updating your profile.'));
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderAvatar = () => {
    if (userData?.fname && userData?.lname) {
      const initials = `${userData.fname[0]}${userData.lname[0]}`.toUpperCase();
      return (
        <View style={[
          styles.avatar,
          {
            backgroundColor: themeStyles.colors.greenThemeColor,
            ...themeStyles.shadow.md
          }
        ]}>
          <Text style={[
            styles.avatarText,
            { color: themeStyles.colors.white }
          ]}>{initials}</Text>
        </View>
      );
    }
    return (
      <View style={[
        styles.avatar,
        {
          backgroundColor: themeStyles.colors.greenThemeColor,
          ...themeStyles.shadow.md
        }
      ]}>
        <Text style={[
          styles.avatarText,
          { color: themeStyles.colors.white }
        ]}>JD</Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[
        styles.container,
        { backgroundColor: themeStyles.colors.black_grey }
      ]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[
      styles.container,
      { backgroundColor: themeStyles.colors.black_grey }
    ]}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
      >
        <Feather 
          name="arrow-left" 
          size={25} 
          color={themeStyles.colors.white} 
        />
      </TouchableOpacity>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <View style={styles.profileSection}>
            <View style={styles.imageContainer}>{renderAvatar()}</View>
            <Text style={[
              styles.userName,
              { color: themeStyles.colors.white }
            ]}>
              {userData ? `${userData.fname || ''} ${userData.lname || ''}` : ''}
            </Text>
          </View>

          <View style={[
            styles.action,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.sm
            }
          ]}>
            <FontAwesome 
              name="user-o" 
              size={20} 
              color={themeStyles.colors.grey} 
            />
            <TextInput
              placeholder={t('firstName')}
              placeholderTextColor={themeStyles.colors.grey}
              value={userData?.fname || ''}
              onChangeText={(txt) => setUserData({ ...userData, fname: txt })}
              style={[
                styles.textInput,
                { color: themeStyles.colors.white }
              ]}
              autoCapitalize="words"
            />
          </View>

          <View style={[
            styles.action,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.sm
            }
          ]}>
            <FontAwesome 
              name="user-o" 
              size={20} 
              color={themeStyles.colors.grey} 
            />
            <TextInput
              placeholder={t('lastName')}
              placeholderTextColor={themeStyles.colors.grey}
              value={userData?.lname || ''}
              onChangeText={(txt) => setUserData({ ...userData, lname: txt })}
              style={[
                styles.textInput,
                { color: themeStyles.colors.white }
              ]}
              autoCapitalize="words"
            />
          </View>

          <View style={[
            styles.action,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.sm
            }
          ]}>
            <FontAwesome 
              name="phone" 
              size={20} 
              color={themeStyles.colors.grey} 
            />
            <TextInput
              placeholder={t('phone')}
              keyboardType="number-pad"
              placeholderTextColor={themeStyles.colors.grey}
              value={userData?.phone || ''}
              onChangeText={(txt) => setUserData({ ...userData, phone: txt })}
              style={[
                styles.textInput,
                { color: themeStyles.colors.white }
              ]}
            />
          </View>

          <View style={[
            styles.action,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.sm
            }
          ]}>
            <FontAwesome 
              name="envelope-o" 
              size={20} 
              color={themeStyles.colors.grey} 
            />
            <TextInput
              placeholder={t('email')}
              keyboardType="email-address"
              placeholderTextColor={themeStyles.colors.grey}
              value={userData?.email || ''}
              onChangeText={(txt) => setUserData({ ...userData, email: txt })}
              style={[
                styles.textInput,
                { color: themeStyles.colors.white }
              ]}
              autoCapitalize="none"
            />
          </View>

          <View style={[
            styles.action,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.sm
            }
          ]}>
            <FontAwesome 
              name="globe" 
              size={20} 
              color={themeStyles.colors.grey} 
            />
            <TextInput
              placeholder={t('country')}
              placeholderTextColor={themeStyles.colors.grey}
              value={userData?.country || ''}
              onChangeText={(txt) => setUserData({ ...userData, country: txt })}
              style={[
                styles.textInput,
                { color: themeStyles.colors.white }
              ]}
              autoCapitalize="words"
            />
          </View>

          <View style={[
            styles.action,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.sm
            }
          ]}>
            <Feather 
              name="map-pin" 
              size={20} 
              color={themeStyles.colors.grey} 
            />
            <TextInput
              placeholder={t('city')}
              placeholderTextColor={themeStyles.colors.grey}
              value={userData?.city || ''}
              onChangeText={(txt) => setUserData({ ...userData, city: txt })}
              style={[
                styles.textInput,
                { color: themeStyles.colors.white }
              ]}
              autoCapitalize="words"
            />
          </View>

          <View style={[
            styles.action,
            { 
              backgroundColor: themeStyles.colors.darkGrey,
              ...themeStyles.shadow.sm
            }
          ]}>
            <Feather 
              name="map" 
              size={20} 
              color={themeStyles.colors.grey} 
            />
            <TextInput
              placeholder={t('state')}
              placeholderTextColor={themeStyles.colors.grey}
              value={userData?.state || ''}
              onChangeText={(txt) => setUserData({ ...userData, state: txt })}
              style={[
                styles.textInput,
                { color: themeStyles.colors.white }
              ]}
              autoCapitalize="words"
            />
          </View>

          <FormButton 
            buttonTitle={isSaving ? t('updating', 'Updating...') : t('update')}
            onPress={handleUpdate}
            disabled={isSaving}
            backgroundColor={themeStyles.colors.greenThemeColor}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contentContainer: {
      padding: horizontalScale(24),
      paddingBottom: verticalScale(48),
    },
    backButton: {
      padding: verticalScale(16),
      marginLeft: horizontalScale(8),
    },
    profileSection: {
      alignItems: "center",
      marginBottom: verticalScale(24),
    },
    imageContainer: {
      justifyContent: "center",
      alignItems: "center",
    },
    avatar: {
      height: moderateScale(120),
      width: moderateScale(120),
      borderRadius: moderateScale(60),
      justifyContent: "center",
      alignItems: "center",
    },
    avatarText: {
      fontSize: moderateScale(28),
      fontWeight: "700",
    },
    userName: {
      marginTop: verticalScale(16),
      fontSize: moderateScale(18),
      fontWeight: "700",
      marginBottom: verticalScale(24),
    },
    action: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: verticalScale(8),
      borderRadius: moderateScale(8),
      padding: moderateScale(16),
    },
    textInput: {
      flex: 1,
      paddingLeft: horizontalScale(16),
      fontSize: moderateScale(16),
    }})