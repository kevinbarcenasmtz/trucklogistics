// src/components/camera/VerificationComponents.tsx
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Info Card Component
export const InfoCard = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';

  return (
    <View
      style={[
        styles.infoCard,
        {
          backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
          ...themeStyles.shadow.sm,
        },
      ]}
    >
      <MaterialIcons name="info-outline" size={20} color={themeStyles.colors.greenThemeColor} />
      <Text
        style={[
          styles.infoText,
          { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary },
        ]}
      >
        {t('verifyInstructions', 'Review and correct any information below before continuing.')}
      </Text>
    </View>
  );
};

// Receipt Image Preview Component
export const ReceiptImagePreview = ({
  imageUri,
  onPress,
}: {
  imageUri: string;
  onPress: () => void;
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.imageContainer, { ...themeStyles.shadow.sm }]}
      activeOpacity={0.8}
    >
      <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
      <View style={styles.imageOverlay}>
        <MaterialIcons name="zoom-in" size={20} color={themeStyles.colors.white} />
        <Text style={[styles.imageOverlayText, { color: themeStyles.colors.white }]}>
          {t('tapToEnlarge', 'Tap to enlarge')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// Edit Field Component
export const EditField = ({
  field,
  value,
  onChange,
  isActive,
  onActivate,
  icon,
  label,
  placeholder,
  keyboardType = 'default',
}: {
  field: string;
  value: string;
  onChange: (value: string) => void;
  isActive: boolean;
  onActivate: () => void;
  icon: string;
  label: string;
  placeholder: string;
  keyboardType?: 'default' | 'decimal-pad' | 'email-address' | 'numeric' | 'phone-pad';
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';

  return (
    <View
      style={[
        styles.formField,
        {
          backgroundColor: isDarkTheme
            ? themeStyles.colors.black_grey
            : themeStyles.colors.background,
          ...themeStyles.shadow.sm,
        },
        isActive && {
          borderColor: themeStyles.colors.greenThemeColor,
          borderWidth: 1,
          backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
        },
      ]}
    >
      <View style={styles.fieldIconContainer}>
        <MaterialIcons
          name={icon}
          size={20}
          color={
            isActive
              ? themeStyles.colors.greenThemeColor
              : isDarkTheme
                ? themeStyles.colors.grey
                : themeStyles.colors.text.secondary
          }
        />
      </View>
      <View style={styles.fieldContent}>
        <Text
          style={[
            styles.fieldLabel,
            { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary },
          ]}
        >
          {label}
        </Text>
        <TextInput
          style={[
            styles.fieldInput,
            { color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary },
          ]}
          value={value || ''}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={
            isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.disabled
          }
          onFocus={onActivate}
          keyboardType={keyboardType}
        />
      </View>
      <TouchableOpacity style={styles.editButton} onPress={onActivate}>
        <Feather
          name="edit-2"
          size={16}
          color={
            isActive
              ? themeStyles.colors.greenThemeColor
              : isDarkTheme
                ? themeStyles.colors.grey
                : themeStyles.colors.text.secondary
          }
        />
      </TouchableOpacity>
    </View>
  );
};

// Form Container Component
export const FormContainer = ({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';

  return (
    <View
      style={[
        styles.formContainer,
        {
          backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
          ...themeStyles.shadow.sm,
        },
      ]}
    >
      <Text
        style={[
          styles.formTitle,
          {
            color: isDarkTheme ? themeStyles.colors.white : themeStyles.colors.text.primary,
            borderBottomColor: isDarkTheme
              ? themeStyles.colors.black_grey
              : themeStyles.colors.border,
          },
        ]}
      >
        {title}
      </Text>

      <View style={styles.formFieldsContainer}>{children}</View>
    </View>
  );
};

// View Raw OCR Button Component
export const ViewRawTextButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.extractedTextButton,
        {
          backgroundColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.surface,
          ...themeStyles.shadow.sm,
        },
      ]}
      onPress={onPress}
    >
      <Feather
        name="file-text"
        size={16}
        color={isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary}
      />
      <Text
        style={[
          styles.extractedTextButtonText,
          { color: isDarkTheme ? themeStyles.colors.grey : themeStyles.colors.text.secondary },
        ]}
      >
        {t('viewRawText', 'View Raw OCR Text')}
      </Text>
    </TouchableOpacity>
  );
};

// Image Preview Modal Component
export const ImagePreviewModal = ({
  visible,
  imageUri,
  onClose,
}: {
  visible: boolean;
  imageUri: string;
  onClose: () => void;
}) => {
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: themeStyles.colors.darkGrey }]}
          onPress={onClose}
          activeOpacity={0.7}
        >
          <MaterialIcons name="close" size={24} color={themeStyles.colors.white} />
        </TouchableOpacity>

        <Image source={{ uri: imageUri }} style={styles.fullScreenImage} resizeMode="contain" />

        <View style={styles.modalControls}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: themeStyles.colors.darkGrey }]}
          >
            <Feather name="download" size={24} color={themeStyles.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: themeStyles.colors.darkGrey }]}
          >
            <Feather name="share" size={24} color={themeStyles.colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Save Button Component
export const SaveButton = ({ onPress, isSaving }: { onPress: () => void; isSaving: boolean }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  const isDarkTheme = theme === 'dark';

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: isDarkTheme
            ? themeStyles.colors.black_grey
            : themeStyles.colors.background,
          borderTopColor: isDarkTheme ? themeStyles.colors.darkGrey : themeStyles.colors.border,
          ...themeStyles.shadow.lg,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.footerButton,
          {
            backgroundColor: themeStyles.colors.greenThemeColor,
            ...themeStyles.shadow.md,
          },
          isSaving && { opacity: 0.6 },
        ]}
        onPress={onPress}
        disabled={isSaving}
        activeOpacity={0.7}
      >
        {isSaving ? (
          <ActivityIndicator size="small" color={themeStyles.colors.white} />
        ) : (
          <>
            <Text style={[styles.footerButtonText, { color: themeStyles.colors.white }]}>
              {t('saveAndContinue', 'Save and Continue')}
            </Text>
            <MaterialIcons name="check-circle" size={20} color={themeStyles.colors.white} />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

// Helper functions for field data
export const getFieldIcon = (field: string) => {
  switch (field) {
    case 'date':
      return 'calendar-today';
    case 'type':
      return 'category';
    case 'amount':
      return 'attach-money';
    case 'vehicle':
      return 'local-shipping';
    case 'vendorName':
      return 'store';
    case 'location':
      return 'place';
    default:
      return 'edit';
  }
};

export const getFieldPlaceholder = (field: string, t: any) => {
  switch (field) {
    case 'date':
      return 'YYYY-MM-DD';
    case 'amount':
      return '$0.00';
    case 'type':
      return 'Fuel, Maintenance, or Other';
    case 'vehicle':
      return 'Vehicle ID or description';
    case 'vendorName':
      return 'Business name';
    case 'location':
      return 'Address';
    default:
      return `Enter ${t(field.toLowerCase(), field)}`;
  }
};

// Styles
const styles = StyleSheet.create({
  infoCard: {
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: moderateScale(14),
    marginLeft: horizontalScale(8),
    flex: 1,
  },
  imageContainer: {
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(16),
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: verticalScale(140),
    borderRadius: moderateScale(12),
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: verticalScale(4),
    paddingHorizontal: horizontalScale(8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageOverlayText: {
    marginLeft: horizontalScale(4),
    fontSize: moderateScale(12),
  },
  formContainer: {
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
  },
  formTitle: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginBottom: verticalScale(16),
    borderBottomWidth: 1,
    paddingBottom: verticalScale(4),
  },
  formFieldsContainer: {
    gap: verticalScale(16),
  },
  formField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: moderateScale(12),
    padding: horizontalScale(16),
  },
  fieldIconContainer: {
    marginRight: horizontalScale(8),
  },
  fieldContent: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: moderateScale(12),
    marginBottom: verticalScale(2),
  },
  fieldInput: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    padding: 0,
  },
  editButton: {
    padding: moderateScale(4),
  },
  extractedTextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(16),
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  extractedTextButtonText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(14),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: horizontalScale(16),
    borderTopWidth: 1,
  },
  footerButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  footerButtonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginRight: horizontalScale(8),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: verticalScale(50),
    right: horizontalScale(20),
    zIndex: 10,
    padding: moderateScale(8),
    borderRadius: moderateScale(20),
  },
  fullScreenImage: {
    width: width * 0.9,
    height: height * 0.6,
    borderRadius: moderateScale(12),
  },
  modalControls: {
    flexDirection: 'row',
    marginTop: verticalScale(16),
    gap: horizontalScale(16),
  },
  modalButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(20),
  },
});
