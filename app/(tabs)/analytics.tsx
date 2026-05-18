import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { getSensorReadingsLast7Days, getPumpRuntimePerDay, getAIDecisionsLast30Days } from '@/database/queries';
import { exportToCSV } from '@/utils/csvExport';
import { format } from 'date-fns';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/colors';

const screenWidth = Dimensions.get('window').width;

export default function Analytics() {
  const [moistureData, setMoistureData] = useState<{ labels: string[]; datasets: { data: number[] }[] }>({
    labels: ['00:00'], datasets: [{ data: [0] }]
  });
  const [pumpData, setPumpData] = useState<{ labels: string[]; datasets: { data: number[] }[] }>({
    labels: ['Sun'], datasets: [{ data: [0] }]
  });
  const [decisionCounts, setDecisionCounts] = useState({ IRRIGATE: 0, SKIP: 0, MONITOR: 0 });

  useEffect(() => { loadData(); }, []);

  function loadData() {
    try {
      const readings = getSensorReadingsLast7Days();
      // Last 6 hours instead of 24 for better mobile visibility
      const hourlyMap: Record<string, number[]> = {};
      readings.filter(r => {
        const diff = Date.now() - new Date(r.created_at).getTime();
        return diff < 6 * 60 * 60 * 1000;
      }).forEach(r => {
        const hour = format(new Date(r.created_at), 'HH:mm');
        if (!hourlyMap[hour]) hourlyMap[hour] = [];
        hourlyMap[hour].push(r.moisture_pct);
      });

      const keys = Object.keys(hourlyMap).sort().slice(-6);
      if (keys.length > 0) {
        setMoistureData({
          labels: keys,
          datasets: [{ data: keys.map(k => hourlyMap[k].reduce((a, b) => a + b, 0) / hourlyMap[k].length) }]
        });
      }

      const pump = getPumpRuntimePerDay();
      const last7Days = pump.slice(-7);
      if (last7Days.length > 0) {
        setPumpData({
          labels: last7Days.map(p => format(new Date(p.date), 'EEE')),
          datasets: [{ data: last7Days.map(p => Math.round(p.total_seconds / 60)) }]
        });
      }

      const decisions = getAIDecisionsLast30Days();
      const counts = { IRRIGATE: 0, SKIP: 0, MONITOR: 0 };
      decisions.forEach(d => {
        if (d.action in counts) counts[d.action as keyof typeof counts]++;
      });
      setDecisionCounts(counts);
    } catch (e) {
      console.warn('Analytics data load failed:', e);
    }
  }

  const chartConfig = {
    backgroundColor: COLORS.secondary,
    backgroundGradientFrom: COLORS.secondary,
    backgroundGradientTo: COLORS.secondary,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(26, 188, 156, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.accent }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Analytics</Text>

        <Text style={styles.chartTitle}>Moisture Trend (Last 6 Hours)</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={moistureData}
            width={screenWidth - SPACING.md * 4}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <Text style={styles.chartTitle}>Pump Runtime (Last 7 Days)</Text>
        <View style={styles.chartCard}>
          <BarChart
            data={pumpData}
            width={screenWidth - SPACING.md * 4}
            height={220}
            chartConfig={{...chartConfig, color: (o=1) => `rgba(243, 156, 18, ${o})` }}
            verticalLabelRotation={0}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix="m"
          />
        </View>

        <Text style={styles.chartTitle}>AI Decisions Overview</Text>
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { borderColor: COLORS.success, backgroundColor: 'rgba(39, 174, 96, 0.1)' }]}>
            <Text style={[styles.statNumber, { color: COLORS.success }]}>{decisionCounts.IRRIGATE}</Text>
            <Text style={styles.statLabel}>Irrigate</Text>
          </View>
          <View style={[styles.statBox, { borderColor: COLORS.danger, backgroundColor: 'rgba(231, 76, 60, 0.1)' }]}>
            <Text style={[styles.statNumber, { color: COLORS.danger }]}>{decisionCounts.SKIP}</Text>
            <Text style={styles.statLabel}>Skip</Text>
          </View>
          <View style={[styles.statBox, { borderColor: COLORS.warning, backgroundColor: 'rgba(243, 156, 18, 0.1)' }]}>
            <Text style={[styles.statNumber, { color: COLORS.warning }]}>{decisionCounts.MONITOR}</Text>
            <Text style={styles.statLabel}>Monitor</Text>
          </View>
        </View>

        <TouchableOpacity onPress={exportToCSV} style={styles.exportButton}>
          <Text style={styles.exportButtonText}>EXPORT SENSOR HISTORY (CSV)</Text>
        </TouchableOpacity>
        
        <View style={styles.footerSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  container: { flex: 1 },
  content: { padding: SPACING.md },
  pageTitle: { color: COLORS.white, fontSize: 24, fontWeight: 'bold', marginBottom: SPACING.lg },
  chartTitle: { color: COLORS.accent, fontSize: 14, fontWeight: 'bold', marginTop: SPACING.lg, marginBottom: SPACING.md, textTransform: 'uppercase' },
  chartCard: { backgroundColor: COLORS.secondary, borderRadius: BORDER_RADIUS.lg, padding: SPACING.sm, alignItems: 'center' },
  chart: { marginVertical: 8, borderRadius: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.sm },
  statBox: { flex: 1, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, borderWidth: 1, alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: COLORS.textMuted, fontSize: 10, textTransform: 'uppercase', marginTop: 4 },
  exportButton: { backgroundColor: COLORS.secondary, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: SPACING.xl, borderWidth: 1, borderColor: COLORS.accent },
  exportButtonText: { color: COLORS.accent, fontWeight: 'bold', letterSpacing: 1 },
  footerSpacer: { height: 60 },
});
