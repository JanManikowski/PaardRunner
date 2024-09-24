import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAOE360zecctwh8-pduD4Dcte2L53qSHRU",
    authDomain: "paardrunner.firebaseapp.com",
    projectId: "paardrunner",
    storageBucket: "paardrunner.appspot.com",
    messagingSenderId: "454825331070",
    appId: "1:454825331070:web:6f559197096cdf9ed2cb2f",
    measurementId: "G-MQ151H6G04"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);