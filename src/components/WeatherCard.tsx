import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeatherData } from '@/store/weatherStore';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { getWeatherDescription } from '@/services/weather.service';

interface Props {
  weather: WeatherData;
}

export default function WeatherCard({ weather }: Props) {
  const { current, computed } = weather;

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Weather Conditions</Text>
      <View style={styles.mainRow}>
        <View>
          <Text style={styles.temp}>{Math.round(current.temperature)}°C</Text>
          <Text style={styles.description}>
            {getWeatherDescription(current.weather_code)}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <Text style={styles.statLabel}>Humidity: <Text style={styles.statValue}>{current.humidity}%</Text></Text>
          <Text style={styles.statLabel}>Rain Chance: <Text style={styles.statValue}>{Math.round(computed.avg_rain_probability)}%</Text></Text>
        </View>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.bottomRow}>
        <View style={styles.smallStat}>
          <Text style={styles.smallStatLabel}>Past 24h Rain</Text>
          <Text style={styles.smallStatValue}>{computed.past_24h_precip_mm.toFixed(1)}mm</Text>
        </View>
        <View style={styles.smallStat}>
          <Text style={styles.smallStatLabel}>Next 24h Rain</Text>
          <Text style={styles.smallStatValue}>{computed.next_24h_precip_mm.toFixed(1)}mm</Text>
        </View>
        <View style={styles.smallStat}>
          <Text style={styles.smallStatLabel}>Daily ET₀</Text>
          <Text style={styles.smallStatValue}>{computed.daily_et0_mm.toFixed(1)}mm</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.md,
  },
  title: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  temp: {
    color: COLORS.white,
    fontSize: 32,
    fontWeight: 'bold',
  },
  description: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  statsContainer: {
    alignItems: 'flex-end',
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.primary,
    opacity: 0.3,
    marginVertical: SPACING.md,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  smallStat: {
    alignItems: 'center',
    flex: 1,
  },
  smallStatLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  smallStatValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
