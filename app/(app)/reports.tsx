// app/(app)/reports.tsx
import { useAppTheme } from '@/src/hooks/useAppTheme'; // Fix: Replace ThemeContext import
import { DocumentStorage } from '@/src/services/DocumentStorage';
import { horizontalScale, moderateScale, verticalScale } from '@/src/theme';
import { Receipt } from '@/src/types/ReceiptInterfaces';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { themeStyles } = useAppTheme(); // Fix: Use useAppTheme instead of useTheme

  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Function to load receipts from storage
  const loadReceipts = useCallback(async () => {
    try {
      const docs = await DocumentStorage.getAllReceipts();
      setReceipts(docs);
    } catch (error) {
      console.error('Error loading receipts:', error);
      Alert.alert(t('error', 'Error'), t('errorLoadingReceipts', 'Failed to load receipts'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  // Load receipts on initial render
  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  }, [loadReceipts]);

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  // Get appropriate icon for receipt type
  const getReceiptTypeIcon = (type: string) => {
    switch (type) {
      case 'Fuel':
        return 'droplet';
      case 'Maintenance':
        return 'tool';
      default:
        return 'file-text';
    }
  };

  // Render a receipt card
  const renderReceiptCard = ({ item }: { item: Receipt }) => (
    <TouchableOpacity
      style={[styles.receiptCard, { backgroundColor: themeStyles.colors.darkGrey }]}
      onPress={() => handleReceiptPress(item)}
    >
      <View style={styles.receiptHeader}>
        <View style={styles.receiptType}>
          <Feather
            name={getReceiptTypeIcon(item.type)}
            size={moderateScale(20)}
            color={themeStyles.colors.text.primary}
          />
          <Text style={[styles.receiptTypeText, { color: themeStyles.colors.text.primary }]}>
            {t(item.type.toLowerCase(), item.type)}
          </Text>
        </View>
        <Text
          style={[
            styles.receiptStatus,
            {
              color:
                item.status === 'Approved'
                  ? themeStyles.colors.status.success
                  : themeStyles.colors.status.warning,
            },
          ]}
        >
          {t(item.status.toLowerCase(), item.status)}
        </Text>
      </View>

      <View style={styles.receiptDetails}>
        <Text style={[styles.receiptAmount, { color: themeStyles.colors.text.primary }]}>
          {item.amount}
        </Text>
        <Text style={[styles.receiptVehicle, { color: themeStyles.colors.text.secondary }]}>
          {item.vehicle}
        </Text>
        {item.vendorName && (
          <Text style={[styles.receiptVendor, { color: themeStyles.colors.text.secondary }]}>
            {item.vendorName}
          </Text>
        )}

        {/* Preview of extracted text */}
        {item.extractedText && (
          <Text
            style={[styles.extractedTextPreview, { color: themeStyles.colors.text.secondary }]}
            numberOfLines={2}
          >
            {item.extractedText.substring(0, 100)}
            {item.extractedText.length > 100 ? '...' : ''}
          </Text>
        )}
      </View>

      <View style={styles.receiptFooter}>
        <Text style={[styles.receiptDate, { color: themeStyles.colors.text.secondary }]}>
          {formatDate(item.date)}
        </Text>
        <Feather
          name="chevron-right"
          size={moderateScale(20)}
          color={themeStyles.colors.text.secondary}
        />
      </View>
    </TouchableOpacity>
  );

  // Handle receipt press - open report screen
  const handleReceiptPress = (receipt: Receipt) => {
    router.push({
      pathname: '/camera/report',
      params: { receipt: JSON.stringify(receipt) },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.colors.black_grey }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeStyles.colors.text.primary }]}>
          {t('receipts', 'Receipts')}
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: themeStyles.colors.greenThemeColor }]}
          onPress={() => router.push('/camera')}
        >
          <Feather name="plus" size={moderateScale(24)} color={themeStyles.colors.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TouchableOpacity
          style={[styles.searchButton, { backgroundColor: themeStyles.colors.darkGrey }]}
        >
          <Feather
            name="search"
            size={moderateScale(20)}
            color={themeStyles.colors.text.secondary}
          />
          <Text style={[styles.searchText, { color: themeStyles.colors.text.secondary }]}>
            {t('searchReceipts', 'Search receipts...')}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeStyles.colors.greenThemeColor} />
        </View>
      ) : receipts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Feather
            name="file-text"
            size={moderateScale(60)}
            color={themeStyles.colors.text.secondary}
          />
          <Text style={[styles.emptyText, { color: themeStyles.colors.text.secondary }]}>
            {t('noReceipts', 'No receipts found')}
          </Text>
          <TouchableOpacity
            style={[styles.scanButton, { backgroundColor: themeStyles.colors.greenThemeColor }]}
            onPress={() => router.push('/camera')}
          >
            <Text style={[styles.scanButtonText, { color: themeStyles.colors.white }]}>
              {t('scanReceipt', 'Scan Receipt')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={receipts}
          renderItem={renderReceiptCard}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.receiptsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeStyles.colors.greenThemeColor]}
              tintColor={themeStyles.colors.greenThemeColor}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  headerTitle: {
    fontSize: moderateScale(34),
    fontWeight: '700',
  },
  addButton: {
    width: moderateScale(44),
    height: moderateScale(44),
    borderRadius: moderateScale(22),
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    paddingHorizontal: horizontalScale(24),
    marginBottom: verticalScale(16),
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: moderateScale(12),
    borderRadius: moderateScale(12),
  },
  searchText: {
    marginLeft: horizontalScale(8),
    fontSize: moderateScale(16),
  },
  receiptsList: {
    padding: moderateScale(24),
    paddingBottom: verticalScale(100), // Extra padding for the tab bar
  },
  receiptCard: {
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: verticalScale(16),
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  receiptType: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  receiptTypeText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
    marginLeft: horizontalScale(8),
  },
  receiptStatus: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  receiptDetails: {
    marginBottom: verticalScale(12),
  },
  receiptAmount: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    marginBottom: verticalScale(4),
  },
  receiptVehicle: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(2),
  },
  receiptVendor: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(4),
  },
  extractedTextPreview: {
    fontSize: moderateScale(12),
    fontStyle: 'italic',
    marginTop: verticalScale(4),
  },
  receiptFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptDate: {
    fontSize: moderateScale(14),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: moderateScale(24),
  },
  emptyText: {
    marginTop: verticalScale(16),
    fontSize: moderateScale(18),
    textAlign: 'center',
  },
  scanButton: {
    marginTop: verticalScale(24),
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(24),
    borderRadius: moderateScale(12),
  },
  scanButtonText: {
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});
