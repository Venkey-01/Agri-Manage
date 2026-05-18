import React, { useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSensorStore } from '@/store/sensorStore';
import { useWeatherStore } from '@/store/weatherStore';
import MoistureGauge from '@/components/MoistureGauge';
import WeatherCard from '@/components/WeatherCard';
import PumpControl from '@/components/PumpControl';
import AIRecommendationBanner from '@/components/AIRecommendationBanner';
import { useSensor } from '@/hooks/useSensor';
import { useWeather } from '@/hooks/useWeather';
import { useAI } from '@/hooks/useAI';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/colors';

export default function Dashboard() {
  const { moisturePercent, lastUpdated, isConnected } = useSensorStore();
  const { current: weather } = useWeatherStore();
  const { startPolling, refresh: refreshSensor, isRefreshing, dbError } = useSensor();
  const { fetchWeather } = useWeather();
  const { decision, runAnalysis } = useAI();

  useEffect(() => { 
    startPolling(); 
    fetchWeather(); 
  }, []);

  useEffect(() => { 
    if (moisturePercent > 0 && weather) runAnalysis(); 
  }, [moisturePercent, weather]);

  const onRefresh = useCallback(async () => {
    await Promise.all([refreshSensor(), fetchWeather()]);
    runAnalysis();
  }, [refreshSensor, fetchWeather, runAnalysis]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.accent} 
          />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AgriManage V2.4</Text>
          <View style={[styles.statusBadge, { backgroundColor: isConnected ? 'rgba(39, 174, 96, 0.2)' : 'rgba(231, 76, 60, 0.2)' }]}>
            <View style={[styles.statusDot, { backgroundColor: isConnected ? COLORS.success : COLORS.danger }]} />
            <Text style={[styles.statusText, { color: isConnected ? COLORS.success : COLORS.danger }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {dbError && (
          <View style={{ backgroundColor: COLORS.danger, padding: SPACING.md, marginHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md }}>
            <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Firebase Error:</Text>
            <Text style={{ color: COLORS.white, fontSize: 12 }}>{dbError}</Text>
          </View>
        )}

        {decision && <AIRecommendationBanner decision={decision} />}

        <View style={styles.gaugeSection}>
          <MoistureGauge value={moisturePercent} />
          <Text style={styles.updateText}>
            Last updated: {lastUpdated ? formatDistanceToNow(lastUpdated, { addSuffix: true }) : 'Never'}
          </Text>
        </View>

        <View style={styles.content}>
          <PumpControl />
          {weather && <WeatherCard weather={weather} />}
        </View>
        
        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  gaugeSection: {
    alignItems: 'center',
    marginVertical: SPACING.xl,
  },
  updateText: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SPACING.sm,
  },
  content: {
    paddingHorizontal: SPACING.md,
  },
  footerSpacer: {
    height: 40,
  },
});
