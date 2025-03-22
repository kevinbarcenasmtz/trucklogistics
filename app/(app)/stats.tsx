// app/(app)/stats.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/src/context/ThemeContext';
import { getThemeStyles, horizontalScale, verticalScale, moderateScale } from '@/src/theme';
import { useRouter } from "expo-router";
import { useTranslation } from 'react-i18next';
import Animated, { FadeIn } from 'react-native-reanimated';

interface StatData {
  title: string;
  value: string;
  change: string;
  icon: any;
  isPositive: boolean;
}

interface PerformanceData {
  label: string;
  value: string;
  color: string;
}

export default function StatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const themeStyles = getThemeStyles(theme);
  
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Add your refresh logic here
      setError(null);
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  }, []);

  const statsData: StatData[] = [
    {
      title: t('totalTrips'),
      value: "328",
      change: "+12%",
      icon: "truck",
      isPositive: true
    },
    {
      title: t('activeVehicles'),
      value: "45",
      change: "-3",
      icon: "activity",
      isPositive: false
    },
    {
      title: t('avgDistance'),
      value: "142 km",
      change: "+5%",
      icon: "map",
      isPositive: true
    },
    {
      title: t('fuelUsage'),
      value: "2,450 L",
      change: "-8%",
      icon: "droplet",
      isPositive: true
    }
  ];

  const performanceData: PerformanceData[] = [
    {
      label: t('vehicleMaintenance'),
      value: "92%",
      color: themeStyles.colors.status.success
    },
    {
      label: t('routeEfficiency'),
      value: "87%",
      color: themeStyles.colors.status.info
    },
    {
      label: t('onTimeDelivery'),
      value: "95%",
      color: themeStyles.colors.status.warning
    }
  ];

  const renderLoadingState = () => (
    <View style={styles.statsGrid}>
      {[1, 2, 3, 4].map((_, index) => (
        <View 
          key={index} 
          style={[
            styles.statCard, 
            { 
              opacity: 0.5,
              backgroundColor: themeStyles.colors.darkGrey 
            }
          ]} 
        />
      ))}
    </View>
  );

  const renderError = () => error && (
    <View style={styles.errorContainer}>
      <Text style={[styles.errorText, { color: themeStyles.colors.status.error }]}>
        {error}
      </Text>
      <TouchableOpacity onPress={onRefresh}>
        <Text style={[styles.retryText, { color: themeStyles.colors.greenThemeColor }]}>
          {t('retry', 'Retry')}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStatCard = ({ title, value, change, icon, isPositive }: StatData) => (
    <Animated.View 
      entering={FadeIn.duration(400)}
      style={[styles.statCard, { backgroundColor: themeStyles.colors.darkGrey }]}
    >
      <View style={[styles.statIconContainer, { backgroundColor: themeStyles.colors.greenThemeColor }]}>
        <Feather name={icon} size={moderateScale(20)} color={themeStyles.colors.white} />
      </View>
      <Text style={[styles.statTitle, { color: themeStyles.colors.grey }]}>
        {title.split(' ').map(word => `${word}\n`)}
      </Text>
      <Text style={[styles.statValue, { color: themeStyles.colors.white }]}>
        {value}
      </Text>
      <View style={styles.statChangeContainer}>
        <Feather 
          name={isPositive ? "arrow-up" : "arrow-down"} 
          size={moderateScale(14)} 
          color={isPositive ? themeStyles.colors.status.success : themeStyles.colors.status.error} 
        />
        <Text style={[
          styles.statChange,
          {color: isPositive ? themeStyles.colors.status.success : themeStyles.colors.status.error}
        ]}>
          {change}
        </Text>
      </View>
    </Animated.View>
  );

  const renderPerformanceBar = ({ label, value, color }: PerformanceData) => (
    <Animated.View 
      entering={FadeIn.duration(600).delay(200)}
      style={styles.performanceItem}
    >
      <View style={styles.performanceHeader}>
        <Text style={[styles.performanceLabel, { color: themeStyles.colors.white }]}>
          {label}
        </Text>
        <Text style={[styles.performanceValue, { color: themeStyles.colors.grey }]}>
          {value}
        </Text>
      </View>
      <View style={[styles.progressBarBackground, { backgroundColor: themeStyles.colors.darkGrey }]}>
        <View style={[
          styles.progressBarFill,
          {
            width: `${parseFloat(value)}%`,
            backgroundColor: color
          }
        ]} />
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: themeStyles.colors.black_grey }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: themeStyles.colors.white }]}>
          {t('statistics')}
        </Text>
        <Text style={[styles.headerSubtitle, { color: themeStyles.colors.grey }]}>
          {t('fleetOverview')}
        </Text>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity 
          style={[
            styles.periodTab, 
            selectedPeriod === 'week' && [
              styles.periodTabActive, 
              { backgroundColor: themeStyles.colors.greenThemeColor }
            ]
          ]}
          onPress={() => setSelectedPeriod('week')}
        >
          <Text style={[
            styles.periodText, 
            { color: themeStyles.colors.grey },
            selectedPeriod === 'week' && { color: themeStyles.colors.white }
          ]}>
            {t('week')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.periodTab, 
            { backgroundColor: themeStyles.colors.darkGrey },
            selectedPeriod === 'month' && [
              styles.periodTabActive, 
              { backgroundColor: themeStyles.colors.greenThemeColor }
            ]
          ]}
          onPress={() => setSelectedPeriod('month')}
        >
          <Text style={[
            styles.periodText, 
            { color: themeStyles.colors.grey },
            selectedPeriod === 'month' && { color: themeStyles.colors.white }
          ]}>
            {t('month')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[
            styles.periodTab, 
            { backgroundColor: themeStyles.colors.darkGrey },
            selectedPeriod === 'year' && [
              styles.periodTabActive, 
              { backgroundColor: themeStyles.colors.greenThemeColor }
            ]
          ]}
          onPress={() => setSelectedPeriod('year')}
        >
          <Text style={[
            styles.periodText, 
            { color: themeStyles.colors.grey },
            selectedPeriod === 'year' && { color: themeStyles.colors.white }
          ]}>
            {t('year')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{paddingBottom: verticalScale(100)}}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[themeStyles.colors.greenThemeColor]}
            tintColor={themeStyles.colors.greenThemeColor}
          />
        }
      >
        {renderError()}
        {isLoading ? renderLoadingState() : (
          <>
            <View style={styles.statsGrid}>
              {statsData.map((stat, index) => (
                <TouchableOpacity 
                  key={index}
                  onPress={() => router.push({
                    pathname: "/reports",
                    params: { type: stat.title }
                  })}
                >
                  {renderStatCard(stat)}
                </TouchableOpacity>
              ))}
            </View>

            <View style={[
              styles.performanceContainer, 
              { borderTopColor: themeStyles.colors.darkGrey }
            ]}>
              <Text style={[styles.sectionTitle, { color: themeStyles.colors.white }]}>
                {t('performanceMetrics')}
              </Text>
              {performanceData.map((item, index) => (
                <View key={index} style={styles.performanceWrapper}>
                  {renderPerformanceBar(item)}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: moderateScale(24),
  },
  headerTitle: {
    fontSize: moderateScale(34),
    fontWeight: '700',
    marginBottom: verticalScale(4),
  },
  headerSubtitle: {
    fontSize: moderateScale(16),
    marginTop: verticalScale(4),
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: horizontalScale(24),
    marginBottom: verticalScale(24),
    gap: horizontalScale(8),
  },
  periodTab: {
    flex: 1,
    paddingVertical: verticalScale(12),
    alignItems: 'center',
    borderRadius: moderateScale(12),
  },
  periodTabActive: {
    // Background color added inline
  },
  periodText: {
    fontSize: moderateScale(16),
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: horizontalScale(20),
    gap: horizontalScale(12),
    justifyContent: 'space-between',
  },
  statCard: {
    width: horizontalScale(155),
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    paddingVertical: moderateScale(20),
    marginBottom: verticalScale(12),
    ...getThemeStyles('light').shadow.md, // Using light theme shadow for visibility
  },
  statIconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: verticalScale(12),
  },
  statTitle: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(16),
  },
  statValue: {
    fontSize: moderateScale(28),
    fontWeight: '700',
    marginVertical: verticalScale(8),
  },
  statChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: verticalScale(4),
  },
  statChange: {
    marginLeft: horizontalScale(4),
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  performanceContainer: {
    padding: moderateScale(24),
    marginTop: verticalScale(14),
    borderTopWidth: 1,
  },
  sectionTitle: {
    fontSize: moderateScale(20),
    fontWeight: '600',
    marginBottom: verticalScale(16),
  },
  performanceWrapper: {
    marginBottom: verticalScale(16),
  },
  performanceItem: {
    marginBottom: verticalScale(12),
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: verticalScale(8),
  },
  performanceLabel: {
    fontSize: moderateScale(14),
  },
  performanceValue: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
  progressBarBackground: {
    height: verticalScale(6),
    borderRadius: moderateScale(3),
  },
  progressBarFill: {
    height: '100%',
    borderRadius: moderateScale(3),
    overflow: 'hidden',
  },
  errorContainer: {
    padding: moderateScale(20),
    alignItems: 'center',
  },
  errorText: {
    fontSize: moderateScale(14),
    marginBottom: verticalScale(8),
  },
  retryText: {
    fontSize: moderateScale(14),
    fontWeight: '500',
  },
});