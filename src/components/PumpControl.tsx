import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Switch } from 'react-native';
import { useSensorStore } from '@/store/sensorStore';
import { controlPump, setIrrigationMode } from '@/services/esp32.service';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/colors';

export default function PumpControl() {
  const { pumpStatus, isManualMode } = useSensorStore();
  const [loading, setLoading] = useState(false);

  const togglePump = async () => {
    if (!isManualMode) {
      Alert.alert(
        "Auto Mode Active", 
        "Switch to MANUAL mode to control the pump whenever you want.",
        [{ text: "OK" }]
      );
      return;
    }

    const nextStatus = pumpStatus === 'ON' ? 'OFF' : 'ON';
    setLoading(true);
    try {
      const success = await controlPump(nextStatus, 'manual');
      if (!success) {
        Alert.alert('Control Failed', 'Could not reach ESP32 device.');
      }
    } catch (e) {
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (manual: boolean) => {
    setLoading(true);
    try {
      await setIrrigationMode(manual);
    } catch (e) {
      Alert.alert('Error', 'Failed to update mode.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.modeRow}>
        <View>
          <Text style={styles.modeTitle}>Control Mode</Text>
          <Text style={styles.modeSubtitle}>
            {isManualMode ? 'Manual: You have full control' : 'Auto: Smart threshold active'}
          </Text>
        </View>
        <Switch
          value={isManualMode}
          onValueChange={handleModeChange}
          trackColor={{ true: COLORS.accent, false: COLORS.muted }}
          thumbColor={COLORS.white}
          disabled={loading}
        />
      </View>

      <View style={styles.divider} />

      <View style={styles.statusRow}>
        <View style={styles.labelContainer}>
          <Text style={styles.label}>Pump Status</Text>
          <Text style={[styles.statusValue, { color: pumpStatus === 'ON' ? COLORS.accent : COLORS.danger }]}>
            {pumpStatus}
          </Text>
          {!isManualMode && pumpStatus === 'ON' && (
            <Text style={styles.autoNote}>Triggered by Auto-Threshold</Text>
          )}
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            { backgroundColor: pumpStatus === 'ON' ? COLORS.danger : COLORS.accent },
            !isManualMode && styles.disabledButton
          ]}
          onPress={togglePump}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.buttonText}>
              {pumpStatus === 'ON' ? 'STOP PUMP' : 'START PUMP'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modeTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modeSubtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: SPACING.md,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 2,
  },
  autoNote: {
    color: COLORS.accent,
    fontSize: 10,
    fontStyle: 'italic',
    marginTop: 2,
  },
  button: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    minWidth: 140,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
