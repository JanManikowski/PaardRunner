// App.js
import React from 'react';
import firebase from 'firebase/app';
import 'firebase/auth'; // Import Firebase Authentication
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { CategoryProvider } from './contexts/CategoryContext';

// Your Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme }) => (
          <CategoryProvider>
            <PaperProvider theme={theme}>
              <NavigationContainer theme={theme}>
                <AppNavigator />
              </NavigationContainer>
            </PaperProvider>
          </CategoryProvider>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}
