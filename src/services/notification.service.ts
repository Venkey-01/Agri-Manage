import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForNotifications(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  return (await Notifications.getExpoPushTokenAsync()).data as string;
}

async function send(title: string, body: string, data?: Record<string, any>) {
  await Notifications.scheduleNotificationAsync({
    content: { title, body, data: data ?? {} },
    trigger: null,
  });
}

export const notify = {
  moistureLow: (pct: number) => 
    send('Low Soil Moisture', `Moisture at ${pct.toFixed(0)}%. Consider irrigating.`, { type: 'moisture_low' }),
  pumpOn: (min: number) => 
    send('Pump Started', `Irrigation started. Running for ~${min} minutes.`, { type: 'pump_on' }),
  pumpOff: () => 
    send('Pump Stopped', 'Irrigation complete.', { type: 'pump_off' }),
  pumpOverride: () => 
    send('Safety Shutoff', 'Pump ran too long and was automatically stopped.', { type: 'pump_safety' }),
  rainDetected: (mm: number) => 
    send('Rain Expected', `${mm.toFixed(1)}mm forecast — irrigation will be skipped.`, { type: 'rain_skip' }),
  sensorDisconnected: () => 
    send('Sensor Disconnected', 'Cannot reach ESP32. Check Wi-Fi connection.', { type: 'disconnected' }),
  dailySummary: (d: { irrigationCount: number; totalMin: number; avgMoisture: number }) =>
    send('Daily Summary', `${d.irrigationCount} sessions, ${d.totalMin}min total. Avg moisture: ${d.avgMoisture.toFixed(0)}%`, { type: 'daily_summary' }),
};
