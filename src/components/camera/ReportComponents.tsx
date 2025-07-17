import { useAppTheme } from '@/src/hooks/useAppTheme';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SectionContainer } from './CameraUIComponents';

// Receipt Card Header Component
export const ReceiptHeader = ({
  receipt,
  formatDate,
  formatTime,
  getReceiptTypeIcon,
}: {
  receipt: Receipt;
  formatDate: (date?: string) => string;
  formatTime: (date?: string) => string;
  getReceiptTypeIcon: (type?: string) => string;
}) => {
  const { textColor, secondaryTextColor, primaryColor } = useAppTheme();

  return (
    <View style={styles.receiptHeader}>
      <View style={styles.receiptType}>
        <MaterialIcons
          name={getReceiptTypeIcon(receipt.type) as any}
          size={24}
          color={primaryColor}
        />
        <Text style={[styles.receiptTypeText, { color: textColor }]}>
          {receipt.type || 'Other'}
        </Text>
      </View>
      <View style={styles.receiptDate}>
        <Text style={[styles.dateText, { color: textColor }]}>{formatDate(receipt.date)}</Text>
        <Text style={[styles.timeText, { color: secondaryTextColor }]}>
          {formatTime(receipt.timestamp)}
        </Text>
      </View>
    </View>
  );
};

// Divider Component
export const Divider = () => {
  const { borderColor } = useAppTheme();

  return <View style={[styles.divider, { backgroundColor: borderColor }]} />;
};

// Receipt Content Component
export const ReceiptContent = ({ receipt, t }: { receipt: Receipt; t: any }) => {
  const { textColor } = useAppTheme();

  return (
    <View style={styles.receiptContent}>
      <Text style={[styles.amountText, { color: textColor }]}>{receipt.amount}</Text>
      <Text style={[styles.vendorText, { color: textColor }]}>
        {receipt.vendorName || t('unknownVendor', 'Unknown Vendor')}
      </Text>

      <View style={styles.detailsGrid}>
        <DetailItem label={t('vehicle', 'Vehicle')} value={receipt.vehicle} />

        {receipt.location && (
          <DetailItem label={t('location', 'Location')} value={receipt.location} multiline />
        )}

        <DetailItem label={t('receiptId', 'Receipt ID')} value={receipt.id.substring(0, 8)} />
      </View>
    </View>
  );
};

// Detail Item Component
export const DetailItem = ({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) => {
  const { textColor, secondaryTextColor } = useAppTheme();

  return (
    <View style={styles.detailItem}>
      <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: textColor }]} numberOfLines={multiline ? 2 : 1}>
        {value}
      </Text>
    </View>
  );
};

// Raw Text Section Component
export const RawTextSection = ({
  receipt,
  showFullText,
  toggleFullText,
  t,
}: {
  receipt: Receipt;
  showFullText: boolean;
  toggleFullText: () => void;
  t: any;
}) => {
  const { textColor, secondaryTextColor, primaryColor, borderColor, surfaceColor } = useAppTheme();

  return (
    <SectionContainer>
      <TouchableOpacity
        style={[styles.rawTextHeader, { borderBottomColor: borderColor }]}
        onPress={toggleFullText}
      >
        <View style={styles.rawTextTitle}>
          <Feather name="file-text" size={20} color={primaryColor} />
          <Text style={[styles.rawTextTitleText, { color: textColor }]}>
            {t('extractedText', 'Extracted Text')}
          </Text>
        </View>
        <Feather
          name={showFullText ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={secondaryTextColor}
        />
      </TouchableOpacity>

      <View style={[styles.rawTextContent, !showFullText && styles.rawTextContentCollapsed]}>
        <Text style={[styles.rawText, { color: secondaryTextColor }]}>
          {receipt.extractedText ||
            t('noTextExtracted', 'No text was extracted from this receipt.')}
        </Text>
      </View>

      {!showFullText && receipt.extractedText && receipt.extractedText.length > 100 && (
        <TouchableOpacity
          style={[styles.showMoreButton, { backgroundColor: surfaceColor }]}
          onPress={toggleFullText}
        >
          <Text style={[styles.showMoreText, { color: primaryColor }]}>
            {t('showMore', 'Show More')}
          </Text>
        </TouchableOpacity>
      )}
    </SectionContainer>
  );
};

// Action Card Component
export const ActionCard = ({
  receipt,
  isStatusUpdating,
  handleApproveDocument,
  handleShareDocument,
  shareLoading,
  t,
}: {
  receipt: Receipt;
  isStatusUpdating: boolean;
  handleApproveDocument: () => void;
  handleShareDocument: () => void;
  shareLoading: boolean;
  t: any;
}) => {
  const { textColor, surfaceColor, successColor, themeStyles } = useAppTheme();

  return (
    <SectionContainer title={t('actions', 'Actions')}>
      <View style={styles.actionButtons}>
        {receipt.status === 'Pending' ? (
          <TouchableOpacity
            style={[
              styles.approveButton,
              {
                backgroundColor: successColor,
                ...themeStyles.shadow.sm,
              },
              isStatusUpdating && { opacity: 0.6 },
            ]}
            onPress={handleApproveDocument}
            disabled={isStatusUpdating}
          >
            {isStatusUpdating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {t('approve', 'Approve')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={[styles.approvedMessage, { backgroundColor: surfaceColor }]}>
            <MaterialIcons name="check-circle" size={20} color={successColor} />
            <Text style={[styles.approvedText, { color: successColor }]}>
              {t('receiptApproved', 'Receipt Approved')}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.shareActionButton,
            {
              backgroundColor: surfaceColor,
              ...themeStyles.shadow.sm,
            },
            shareLoading && { opacity: 0.6 },
          ]}
          onPress={handleShareDocument}
          disabled={shareLoading}
        >
          {shareLoading ? (
            <ActivityIndicator size="small" color={textColor} />
          ) : (
            <>
              <Feather name="share-2" size={20} color={textColor} />
              <Text style={[styles.buttonText, { color: textColor }]}>{t('share', 'Share')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SectionContainer>
  );
};

// Footer Button Component
export const FooterButton = ({ onPress, t }: { onPress: () => void; t: any }) => {
  const { backgroundColor, borderColor, primaryColor, themeStyles } = useAppTheme();

  return (
    <View
      style={[
        styles.footer,
        {
          backgroundColor: backgroundColor,
          borderTopColor: borderColor,
          ...themeStyles.shadow.lg,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.doneButton,
          {
            backgroundColor: primaryColor,
            ...themeStyles.shadow.md,
          },
        ]}
        onPress={onPress}
      >
        <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>{t('done', 'Done')}</Text>
      </TouchableOpacity>
    </View>
  );
};

// Loading Component
export const LoadingView = ({ t }: { t: any }) => {
  const { backgroundColor, textColor, primaryColor } = useAppTheme();

  return (
    <View style={[styles.loadingContainer, { backgroundColor: backgroundColor }]}>
      <ActivityIndicator size="large" color={primaryColor} />
      <Text style={[styles.loadingText, { color: textColor }]}>
        {t('loadingReceipt', 'Loading receipt...')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(8),
  },
  receiptType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptTypeText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
  },
  receiptDate: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: moderateScale(14),
  },
  timeText: {
    fontSize: moderateScale(12),
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: verticalScale(8),
  },
  receiptContent: {
    paddingVertical: verticalScale(8),
  },
  amountText: {
    fontSize: moderateScale(24),
    fontWeight: 'bold',
    marginBottom: verticalScale(4),
  },
  vendorText: {
    fontSize: moderateScale(16),
    marginBottom: verticalScale(16),
  },
  detailsGrid: {
    marginTop: verticalScale(8),
  },
  detailItem: {
    marginBottom: verticalScale(8),
  },
  detailLabel: {
    fontSize: moderateScale(12),
    marginBottom: 2,
  },
  detailValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  rawTextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: verticalScale(16),
    borderBottomWidth: 1,
  },
  rawTextTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rawTextTitleText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginLeft: horizontalScale(8),
  },
  rawTextContent: {
    paddingVertical: verticalScale(16),
  },
  rawTextContentCollapsed: {
    maxHeight: verticalScale(100),
    overflow: 'hidden',
  },
  rawText: {
    fontSize: moderateScale(12),
    lineHeight: moderateScale(16),
  },
  showMoreButton: {
    alignItems: 'center',
    padding: verticalScale(8),
  },
  showMoreText: {
    fontSize: moderateScale(12),
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: horizontalScale(8),
  },
  approveButton: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  shareActionButton: {
    flex: 1,
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontSize: moderateScale(16),
    fontWeight: 'bold',
    marginLeft: horizontalScale(8),
  },
  approvedMessage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
  },
  approvedText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: horizontalScale(16),
    borderTopWidth: 1,
  },
  doneButton: {
    padding: moderateScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
    justifyContent: 'center',
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
