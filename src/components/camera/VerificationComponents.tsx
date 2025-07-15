// src/components/camera/VerificationComponents.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
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
  const { getSurfaceColor, textColor, primaryColor } = useAppTheme();

  return (
    <View style={[styles.infoCard, { backgroundColor: getSurfaceColor() }]}>
      <MaterialIcons name="info-outline" size={20} color={primaryColor} />
      <Text style={[styles.infoText, { color: textColor }]}>
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

  return (
    <TouchableOpacity onPress={onPress} style={styles.imageContainer} activeOpacity={0.8}>
      <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
      <View style={styles.imageOverlay}>
        <MaterialIcons name="zoom-in" size={20} color="#FFFFFF" />
        <Text style={[styles.imageOverlayText, { color: '#FFFFFF' }]}>
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
  const { getSurfaceColor, textColor, secondaryTextColor, primaryColor } = useAppTheme();

  return (
    <View style={[styles.formField, { backgroundColor: getSurfaceColor() }]}>
      <View style={styles.fieldIconContainer}>
        <MaterialIcons name={icon as any} size={20} color={primaryColor} />
      </View>
      <View style={styles.fieldContent}>
        <Text style={[styles.fieldLabel, { color: secondaryTextColor }]}>{label}</Text>
        <TextInput
          style={[styles.fieldInput, { color: textColor }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={secondaryTextColor}
          keyboardType={keyboardType}
          onFocus={onActivate}
          multiline={field === 'notes'}
          numberOfLines={field === 'notes' ? 3 : 1}
        />
      </View>
      <TouchableOpacity style={styles.editButton} onPress={onActivate}>
        <MaterialIcons name="edit" size={16} color={primaryColor} />
      </TouchableOpacity>
    </View>
  );
};

// Form Container Component
export const FormContainer = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  const { getSurfaceColor, textColor, borderColor } = useAppTheme();

  return (
    <View style={[styles.formContainer, { backgroundColor: getSurfaceColor() }]}>
      <Text style={[styles.formTitle, { color: textColor, borderBottomColor: borderColor }]}>
        {title}
      </Text>
      <View style={styles.formFieldsContainer}>{children}</View>
    </View>
  );
};

// View Raw OCR Button Component
export const ViewRawTextButton = ({ onPress }: { onPress: () => void }) => {
  const { t } = useTranslation();
  const { getSurfaceColor, secondaryTextColor } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.extractedTextButton, { backgroundColor: getSurfaceColor() }]}
      onPress={onPress}
    >
      <Feather name="file-text" size={16} color={secondaryTextColor} />
      <Text style={[styles.extractedTextButtonText, { color: secondaryTextColor }]}>
        {t('viewExtractedText', 'View extracted text')}
      </Text>
    </TouchableOpacity>
  );
};

// Save Button Component
export const SaveButton = ({
  onPress,
  isLoading = false,
}: {
  onPress: () => void;
  isLoading?: boolean;
}) => {
  const { t } = useTranslation();
  const { primaryColor, borderColor } = useAppTheme();

  return (
    <View style={[styles.footer, { borderTopColor: borderColor }]}>
      <TouchableOpacity
        style={[styles.footerButton, { backgroundColor: primaryColor }]}
        onPress={onPress}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <>
            <Text style={[styles.footerButtonText, { color: '#FFFFFF' }]}>
              {t('saveReceipt', 'Save Receipt')}
            </Text>
            <MaterialIcons name="save" size={20} color="#FFFFFF" />
          </>
        )}
      </TouchableOpacity>
    </View>
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
  const { primaryColor } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={[styles.closeButton, { backgroundColor: primaryColor }]}
          onPress={onClose}
        >
          <MaterialIcons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Image source={{ uri: imageUri }} style={styles.fullScreenImage} resizeMode="contain" />
      </View>
    </Modal>
  );
};

// Helper functions for field configuration
export const getFieldIcon = (field: string): string => {
  switch (field) {
    case 'date':
      return 'event';
    case 'amount':
      return 'attach-money';
    case 'type':
      return 'category';
    case 'vehicle':
      return 'directions-car';
    case 'vendorName':
      return 'store';
    case 'location':
      return 'location-on';
    case 'notes':
      return 'note';
    default:
      return 'info';
  }
};

export const getFieldPlaceholder = (field: string): string => {
  switch (field) {
    case 'date':
      return 'YYYY-MM-DD';
    case 'amount':
      return '$0.00';
    case 'type':
      return 'Select type';
    case 'vehicle':
      return 'Vehicle information';
    case 'vendorName':
      return 'Vendor name';
    case 'location':
      return 'Location';
    case 'notes':
      return 'Add notes...';
    default:
      return 'Enter value';
  }
};

const styles = StyleSheet.create({
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: horizontalScale(16),
    marginBottom: verticalScale(16),
    borderRadius: moderateScale(12),
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
});
