import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAOE360zecctwh8-pduD4Dcte2L53qSHRU",
  authDomain: "paardrunner.firebaseapp.com",
  projectId: "paardrunner",
  storageBucket: "paardrunner.appspot.com",
  messagingSenderId: "454825331070",
  appId: "1:454825331070:web:6f559197096cdf9ed2cb2f",
  measurementId: "G-MQ151H6G04"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth with React Native persistence
export const auth = initializeAuth(app)

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);
