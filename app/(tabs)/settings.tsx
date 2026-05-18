import React from 'react';
import { View, Text, ScrollView, Switch, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/store/settingsStore';
import * as Location from 'expo-location';
import { COLORS, SPACING, BORDER_RADIUS } from '@/constants/colors';
import { CROP_DATABASE, SOIL_DRAINAGE, GROWTH_STAGE_MULTIPLIER } from '@/constants/crops';

export default function Settings() {
  const {
    esp32IP, esp32Token, aiMode, ollamaURL, ollamaModel,
    notificationsEnabled, theme, moistureThreshold, locationName,
    selectedCrop, selectedSoilType, selectedGrowthStage,
    updateSettings, setLocation,
  } = useSettingsStore();

  const { setMoistureThreshold } = require('@/services/esp32.service');

  async function detectLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({});
    const [geo] = await Location.reverseGeocodeAsync(loc.coords);
    if (geo) {
      setLocation(loc.coords.latitude, loc.coords.longitude, `${geo.city}, ${geo.region}`);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        <Text style={styles.sectionTitle}>Device Connection</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>ESP32 IP Address</Text>
          <TextInput 
            value={esp32IP} 
            onChangeText={(v) => updateSettings({ esp32IP: v })}
            keyboardType="numeric" 
            style={styles.textInput}
            placeholderTextColor={COLORS.textMuted}
          />
          <Text style={styles.inputLabel}>Auth Token</Text>
          <TextInput 
            value={esp32Token} 
            onChangeText={(v) => updateSettings({ esp32Token: v })}
            secureTextEntry 
            style={styles.textInput}
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <Text style={styles.sectionTitle}>Weather Location</Text>
        <View style={styles.card}>
          <Text style={styles.locationText}>{locationName || 'Location not set'}</Text>
          <TouchableOpacity onPress={detectLocation} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>AUTO-DETECT LOCATION</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>AI Model (Tiered Setup)</Text>
        <View style={styles.card}>
          {(['tflite', 'local-llm'] as const).map((mode) => (
            <TouchableOpacity 
              key={mode} 
              onPress={() => updateSettings({ aiMode: mode })}
              style={styles.radioItem}
            >
              <View>
                <Text style={styles.radioTitle}>{mode.replace('-', ' ').toUpperCase()}</Text>
                <Text style={styles.radioDesc}>
                  {mode === 'tflite' ? 'On-device ML • Predicted' : 'Local LLM • Best Reasoning'}
                </Text>
              </View>
              <View style={[styles.radioCircle, aiMode === mode && styles.radioCircleActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {aiMode === 'local-llm' && (
          <View style={styles.card}>
            <Text style={styles.inputLabel}>Ollama URL</Text>
            <TextInput 
              value={ollamaURL} 
              onChangeText={(v) => updateSettings({ ollamaURL: v })}
              style={styles.textInput}
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>Model Name</Text>
            <TextInput 
              value={ollamaModel} 
              onChangeText={(v) => updateSettings({ ollamaModel: v })}
              style={styles.textInput}
              autoCapitalize="none"
              placeholder="e.g. phi3:mini"
            />
          </View>
        )}

        <Text style={styles.sectionTitle}>App Preferences</Text>
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Push Notifications</Text>
            <Switch 
              value={notificationsEnabled}
              onValueChange={(v) => updateSettings({ notificationsEnabled: v })}
              trackColor={{ true: COLORS.accent, false: COLORS.secondary }}
            />
          </View>

          <View style={styles.divider} />

          <Text style={styles.inputLabel}>Auto-Irrigation Threshold (%)</Text>
          <View style={styles.thresholdRow}>
            <TextInput 
              value={moistureThreshold.toString()} 
              onChangeText={(v) => {
                const val = parseInt(v) || 0;
                updateSettings({ moistureThreshold: val });
                setMoistureThreshold(val);
              }}
              keyboardType="numeric" 
              style={[styles.textInput, { flex: 1 }]}
            />
            <Text style={styles.thresholdUnit}>%</Text>
          </View>
          <Text style={styles.inputHint}>Pump starts automatically below this moisture level.</Text>
        </View>

        <Text style={styles.sectionTitle}>Farm Profile</Text>
        <View style={styles.card}>
          <Text style={styles.inputLabel}>Select Crop</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {Object.keys(CROP_DATABASE).map(c => (
              <TouchableOpacity 
                key={c} 
                style={[styles.chip, selectedCrop === c && styles.chipActive]}
                onPress={() => updateSettings({ selectedCrop: c })}
              >
                <Text style={[styles.chipText, selectedCrop === c && styles.chipTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Soil Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {Object.keys(SOIL_DRAINAGE).map(s => (
              <TouchableOpacity 
                key={s} 
                style={[styles.chip, selectedSoilType === s && styles.chipActive]}
                onPress={() => updateSettings({ selectedSoilType: s })}
              >
                <Text style={[styles.chipText, selectedSoilType === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.inputLabel}>Growth Stage</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {Object.keys(GROWTH_STAGE_MULTIPLIER).map(g => (
              <TouchableOpacity 
                key={g} 
                style={[styles.chip, selectedGrowthStage === g && styles.chipActive]}
                onPress={() => updateSettings({ selectedGrowthStage: g })}
              >
                <Text style={[styles.chipText, selectedGrowthStage === g && styles.chipTextActive]}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
  content: {
    padding: SPACING.md,
  },
  pageTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.secondary,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    marginTop: SPACING.md,
  },
  textInput: {
    color: COLORS.white,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: SPACING.sm,
  },
  locationText: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: SPACING.md,
  },
  secondaryButton: {
    backgroundColor: 'rgba(26, 188, 156, 0.2)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: COLORS.accent,
    fontWeight: 'bold',
    fontSize: 12,
  },
  radioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  radioTitle: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  radioDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.muted,
  },
  radioCircleActive: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.accent,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    color: COLORS.white,
    fontSize: 16,
  },
  footerSpacer: {
    height: 40,
  },
  chipScroll: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginVertical: SPACING.md,
  },
  thresholdRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thresholdUnit: {
    color: COLORS.accent,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: SPACING.sm,
  },
  inputHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
