import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { AIOutput } from '@/ml/ruleEngine';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { controlPump } from '@/services/esp32.service';

interface Props {
  decision: AIOutput;
}

export default function AIRecommendationBanner({ decision }: Props) {
  const [loading, setLoading] = useState(false);

  const getBannerColor = () => {
    switch (decision.action) {
      case 'IRRIGATE': return COLORS.success;
      case 'SKIP': return COLORS.danger;
      case 'MONITOR': return COLORS.warning;
      default: return COLORS.accent;
    }
  };

  const handleApply = async () => {
    setLoading(true);
    try {
      if (decision.action === 'IRRIGATE') {
        const success = await controlPump('ON', 'ai_suggestion');
        if (success) Alert.alert("Success", "Pump started based on AI suggestion.");
      } else if (decision.action === 'SKIP') {
        const success = await controlPump('OFF', 'ai_suggestion');
        if (success) Alert.alert("Success", "Pump stopped/kept off based on AI suggestion.");
      }
    } catch (e) {
      Alert.alert("Error", "Could not apply AI recommendation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { borderColor: getBannerColor() }]}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: getBannerColor() }]}>
          <Text style={styles.badgeText}>AI RECOMMENDATION: {decision.action}</Text>
        </View>
        {(decision.action === 'IRRIGATE' || decision.action === 'SKIP') && (
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: getBannerColor() }]} 
            onPress={handleApply}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.applyButtonText}>APPLY NOW</Text>}
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.reason}>{decision.reason}</Text>
      {decision.action === 'IRRIGATE' && (
        <Text style={styles.suggestion}>
          Suggested Duration: <Text style={styles.bold}>{decision.suggested_duration_minutes} minutes</Text>
        </Text>
      )}
      <View style={styles.footer}>
        <Text style={styles.tierText}>Engine: {decision.tier} • Confidence: {(decision.confidence * 100).toFixed(0)}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(27, 79, 114, 0.4)',
    marginHorizontal: SPACING.md,
    marginTop: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: SPACING.sm,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  applyButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  applyButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  reason: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: SPACING.xs,
  },
  suggestion: {
    color: COLORS.accent,
    fontSize: 14,
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    marginTop: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  tierText: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
});
