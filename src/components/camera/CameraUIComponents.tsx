// src/components/camera/CameraUIComponents.tsx
import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet,
  ActivityIndicator,
  Animated
} from 'react-native';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { useTheme } from '@/src/context/ThemeContext';
import * as Haptics from 'expo-haptics';

// Screen header with back button
export const ScreenHeader = ({ 
  title, 
  onBack, 
  rightComponent = null 
}: { 
  title: string, 
  onBack: () => void, 
  rightComponent?: React.ReactNode 
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  return (
    <View style={[
      styles.header,
      { 
        borderBottomColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.border,
        backgroundColor: isDarkTheme ? themeStyles.colors.black_grey : themeStyles.colors.background
      }
    ]}>
      <TouchableOpacity 
        style={[
          styles.backButton,
          { 
            backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface
          }
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}
      >
        <MaterialIcons 
          name="arrow-back" 
          size={24} 
          color={isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary} 
        />
      </TouchableOpacity>
      
      <Text style={[
        styles.headerTitle,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
      ]}>{title}</Text>
      
      {rightComponent || <View style={{ width: 40 }} />}
    </View>
  );
};

// Action button with icon and text
export const ActionButton = ({
  title,
  icon,
  onPress,
  isLoading = false,
  backgroundColor,
  color = '#FFFFFF',
  disabled = false,
  style = {}
}: {
  title: string,
  icon?: string,
  onPress: () => void,
  isLoading?: boolean,
  backgroundColor?: string,
  color?: string,
  disabled?: boolean,
  style?: any
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  return (
    <TouchableOpacity 
      style={[
        styles.actionButton,
        { backgroundColor: backgroundColor || themeStyles.colors.greenThemeColor },
        disabled && { opacity: 0.6 },
        style
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
      activeOpacity={0.7}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={24} 
              color={color} 
              style={{ marginRight: horizontalScale(8) }}
            />
          )}
          <Text style={[
            styles.buttonText,
            { color }
          ]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

// Section container with title
export const SectionContainer = ({
  title,
  children,
  icon,
  rightComponent,
  style = {}
}: {
  title?: string,
  children: React.ReactNode,
  icon?: string,
  rightComponent?: React.ReactNode,
  style?: any
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  return (
    <View style={[
      styles.sectionContainer,
      { 
        backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
        ...themeStyles.shadow.sm
      },
      style
    ]}>
      {title && (
        <View style={styles.sectionHeader}>
          {icon && (
            <MaterialIcons 
              name={icon} 
              size={20} 
              color={themeStyles.colors.greenThemeColor} 
              style={{ marginRight: horizontalScale(8) }}
            />
          )}
          <Text style={[
            styles.sectionTitle,
            { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
          ]}>{title}</Text>
          {rightComponent}
        </View>
      )}
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );
};

// Status Banner
export const StatusBanner = ({
  status,
  successText,
  pendingText
}: {
  status: 'Approved' | 'Pending',
  successText: string,
  pendingText: string
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  const isApproved = status === 'Approved';
  
  return (
    <View
      style={[
        styles.statusBanner,
        isApproved ? 
          { 
            backgroundColor: themeStyles.colors.status.success + '22',
            borderColor: themeStyles.colors.status.success 
          } : 
          { 
            backgroundColor: themeStyles.colors.status.warning + '22',
            borderColor: themeStyles.colors.status.warning 
          }
      ]}
    >
      <MaterialIcons 
        name={isApproved ? "check-circle" : "pending"} 
        size={24} 
        color={isApproved ? 
          themeStyles.colors.status.success : 
          themeStyles.colors.status.warning
        } 
      />
      <Text style={[
        styles.statusText,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
      ]}>
        {isApproved ? successText : pendingText}
      </Text>
    </View>
  );
};

// Loading screen
export const LoadingScreen = ({ message }: { message: string }) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';
  
  return (
    <View style={[
      styles.loadingContainer,
      { backgroundColor: isDarkTheme ? themeStyles.colors.black_grey : themeStyles.colors.background }
    ]}>
      <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
      <Text style={[
        styles.loadingText,
        { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary }
      ]}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(60),
    paddingBottom: verticalScale(16),
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    fontWeight: 'bold',
  },
  backButton: {
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  actionButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: moderateScale(16),
  },
  sectionContainer: {
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: horizontalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    flex: 1,
  },
  sectionContent: {
    padding: horizontalScale(16),
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    borderWidth: 1,
  },
  statusText: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(14),
  },
});