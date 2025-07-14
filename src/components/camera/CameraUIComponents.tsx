// src/components/camera/CameraUIComponents.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// get the MaterialIcons icon name type
type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

// screen header with back button
export const ScreenHeader = ({
  title,
  onBack,
  rightComponent = null,
}: {
  title: string;
  onBack: () => void;
  rightComponent?: React.ReactNode;
}) => {
  const { backgroundColor, surfaceColor, textColor, borderColor } = useAppTheme();

  return (
    <View
      style={[
        styles.header,
        {
          borderBottomColor: borderColor,
          backgroundColor: backgroundColor,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.backButton,
          {
            backgroundColor: surfaceColor,
          },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onBack();
        }}
      >
        <MaterialIcons name="arrow-back" size={24} color={textColor} />
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: textColor }]}>{title}</Text>

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
  style = {},
}: {
  title: string;
  icon?: MaterialIconName;
  onPress: () => void;
  isLoading?: boolean;
  backgroundColor?: string;
  color?: string;
  disabled?: boolean;
  style?: any;
}) => {
  const { primaryColor } = useAppTheme();

  return (
    <TouchableOpacity
      style={[
        styles.actionButton,
        { backgroundColor: backgroundColor || primaryColor },
        disabled && { opacity: 0.6 },
        style,
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
          <Text style={[styles.buttonText, { color }]}>{title}</Text>
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
  style = {},
}: {
  title?: string;
  children: React.ReactNode;
  icon?: MaterialIconName; // Fixed: Use proper MaterialIcons type
  rightComponent?: React.ReactNode;
  style?: any;
}) => {
  const { surfaceColor, textColor, primaryColor, themeStyles } = useAppTheme();

  return (
    <View
      style={[
        styles.sectionContainer,
        {
          backgroundColor: surfaceColor,
          ...themeStyles.shadow.sm,
        },
        style,
      ]}
    >
      {title && (
        <View style={styles.sectionHeader}>
          {icon && (
            <MaterialIcons
              name={icon}
              size={20}
              color={primaryColor}
              style={{ marginRight: horizontalScale(8) }}
            />
          )}
          <Text style={[styles.sectionTitle, { color: textColor }]}>{title}</Text>
          {rightComponent}
        </View>
      )}
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
};

// Status Banner
export const StatusBanner = ({
  status,
  successText,
  pendingText,
}: {
  status: 'Approved' | 'Pending';
  successText: string;
  pendingText: string;
}) => {
  const { textColor, successColor, warningColor } = useAppTheme();

  const isApproved = status === 'Approved';

  return (
    <View
      style={[
        styles.statusBanner,
        isApproved
          ? {
              backgroundColor: successColor + '22',
              borderColor: successColor,
            }
          : {
              backgroundColor: warningColor + '22',
              borderColor: warningColor,
            },
      ]}
    >
      <MaterialIcons
        name={isApproved ? 'check-circle' : 'pending'}
        size={24}
        color={isApproved ? successColor : warningColor}
      />
      <Text style={[styles.statusText, { color: textColor }]}>
        {isApproved ? successText : pendingText}
      </Text>
    </View>
  );
};

// Loading screen
export const LoadingScreen = ({ message }: { message: string }) => {
  const { backgroundColor, textColor, primaryColor } = useAppTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor }]}>
      <ActivityIndicator size="large" color={primaryColor} />
      <Text style={[styles.loadingText, { color: textColor }]}>{message}</Text>
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
