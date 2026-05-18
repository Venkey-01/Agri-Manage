import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  initializeAuth, 
  getReactNativePersistence, 
  Auth 
} from 'firebase/auth';
import { getDatabase, Database, ref, set, onValue, push } from 'firebase/database';
import { getFirestore, Firestore, collection, addDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey:            "AIzaSyB-rybqD4lxDk9m_GSxV0Co11IkVLZpd2M",
  authDomain:        "agri-manage-smart-irrigation.firebaseapp.com",
  databaseURL:       "https://agri-manage-smart-irrigation-default-rtdb.firebaseio.com",
  projectId:         "agri-manage-smart-irrigation",
  storageBucket:     "agri-manage-smart-irrigation.firebasestorage.app",
  messagingSenderId: "582093554103",
  appId:             "1:582093554103:web:120e748882a414c1b82832",
};

// Singleton instances
let app: FirebaseApp;
let authInstance: Auth;
let database: Database;
let firestore: Firestore;

// Robust initialization
try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  database = getDatabase(app);
  firestore = getFirestore(app);

} catch (globalError) {
  // If we try to log this, we'll see it if we debug locally
}

// Export clean getters
export const getFirebaseAuth = () => null; // Auth is no longer used
export const getFirebaseDB = () => database;
export const getFirebaseFirestore = () => firestore;

// Compatibility exports
export const auth = {
  get currentUser() { return null; },
  onAuthStateChanged: (cb: any) => cb(null),
  signOut: () => Promise.resolve(),
};

export const db = {
  get ref() { return (path: string) => ref(database, path); }
};

// Data methods
export async function writeSensorReading(data: any) {
  try {
    await set(ref(database, 'irrigation/sensor_data'), data);
    await push(ref(database, 'irrigation/history'), data);
  } catch (e) {
    console.warn('Firebase write failed:', e);
  }
}

export function listenToSensorData(callback: (data: any) => void) {
  if (!database) return () => {};
  return onValue(ref(database, 'irrigation/sensor_data'), (snap) => {
    if (snap.exists()) callback(snap.val());
  });
}

export async function writePumpCommand(action: 'ON' | 'OFF') {
  try {
    await set(ref(database, 'irrigation/pump_command'), {
      action,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Firebase pump command failed:', e);
  }
}

export async function writeIrrigationMode(isManual: boolean) {
  try {
    await set(ref(database, 'irrigation/mode'), isManual ? 1 : 0);
  } catch (e) {
    console.warn('Firebase mode write failed:', e);
  }
}

export async function writeThreshold(value: number) {
  try {
    await set(ref(database, 'irrigation/threshold'), value);
  } catch (e) {
    console.warn('Firebase threshold write failed:', e);
  }
}

export async function saveAIDecision(userId: string, decision: any) {
  if (!firestore) return;
  return addDoc(collection(firestore, `users/${userId}/ai_decisions`), {
    ...decision, timestamp: new Date(),
  });
}
