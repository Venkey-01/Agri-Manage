import { useEffect, useState } from 'react';
import { useSensorStore } from '@/store/sensorStore';
import { getFirebaseDB } from '@/services/firebase.service';
import { ref, onValue } from 'firebase/database';
import { insertSensorReading } from '@/database/queries';

export function useSensor() {
  const { setMoistureData, setConnected } = useSensorStore();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  useEffect(() => {
    const db = getFirebaseDB();
    if (!db) {
      setDbError("Firebase DB is undefined!");
      return;
    }

    let watchdogTimer: NodeJS.Timeout;

    // Listen to the entire irrigation node to get both sensor data and online status
    const irrigationRef = ref(db, 'irrigation');
    
    setDbError(null); 
    
    const unsubscribe = onValue(irrigationRef, (snap) => {
      setDbError(null); // Clear error on success
      
      // Clear previous timer and set a new one
      clearTimeout(watchdogTimer);
      watchdogTimer = setTimeout(() => {
        setConnected(false); // If no new data arrives in 15s, ESP32 lost power
      }, 15000);

      if (snap.exists()) {
        const data = snap.val();
        
        // Match keys with ESP32: "moisture" and "status"
        if (data.sensor_data) {
          const mPct = data.sensor_data.moisture || 0;
          const pStatus = data.sensor_data.status || 'OFF';
          const isManual = data.mode === 1;
          
          setMoistureData({
            moisturePercent: mPct,
            pumpStatus:      pStatus,
            isManualMode:    isManual,
          });

          // Save to local SQLite so Analytics charts have data!
          try {
            insertSensorReading(mPct, 0, pStatus);
          } catch (e) {
            console.warn("Failed to log sensor reading:", e);
          }
        }
        
        // As long as we receive data, assume connected.
        setConnected(true);
      } else {
        setConnected(false);
      }
    }, (error) => {
      console.error("Firebase Database Read Error:", error);
      setDbError(error.message || "Unknown DB Error");
      setConnected(false);
    });

    return () => {
      unsubscribe();
      clearTimeout(watchdogTimer);
    };
  }, []);

  async function refresh() {
    setIsRefreshing(true);
    // Connection is live via Firebase, so "refreshing" just ensures we are listening
    await new Promise(resolve => setTimeout(resolve, 800)); 
    setIsRefreshing(false);
  }

  return { 
    startPolling: () => {}, // No longer needed for Firebase
    refresh, 
    isRefreshing,
    dbError
  };
}

