import React from 'react';
import { StatusBar } from 'react-native';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { CategoryProvider } from './contexts/CategoryContext';
import Toast from 'react-native-toast-message';
import { CoinProvider } from './contexts/CoinContext';

export default function App() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme }) => (
          <CategoryProvider>
            <PaperProvider theme={theme}>
              <CoinProvider>
                <>
                  {/* Hide the status bar */}
                  <StatusBar hidden />
                  <NavigationContainer theme={theme}>
                    <AppNavigator />
                    <Toast />
                  </NavigationContainer>
                </>
              </CoinProvider>
            </PaperProvider>
          </CategoryProvider>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}
