import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
      <AppNavigator />
    </NavigationContainer>
    </ThemeProvider>
    
  );
}
