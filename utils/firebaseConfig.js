import { initializeApp, getApps } from 'firebase/app';
import { getAuth, initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: "AIzaSyAOE360zecctwh8-pduD4Dcte2L53qSHRU",
  authDomain: "paardrunner.firebaseapp.com",
  projectId: "paardrunner",
  storageBucket: "paardrunner.appspot.com", // FIXED this line: ".app" → ".com"
  messagingSenderId: "454825331070",
  appId: "1:454825331070:web:6f559197096cdf9ed2cb2f",
  measurementId: "G-MQ151H6G04"
};

// Make sure to not reinitialize app
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Auth safely
let auth;

if (Platform.OS === 'web') {
  auth = getAuth(app);
  auth.setPersistence(browserLocalPersistence);
} else {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  const { getReactNativePersistence } = require('firebase/auth/react-native');
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

// Initialize Firestore and Storage
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
