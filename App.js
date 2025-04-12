import React from 'react';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { CategoryProvider } from './contexts/CategoryContext';
import Toast from 'react-native-toast-message';
import { CoinProvider } from './contexts/CoinContext'; // Import here

export default function App() {
  return (
    <ThemeProvider>
      <ThemeContext.Consumer>
        {({ theme }) => (
          <CategoryProvider>
            <PaperProvider theme={theme}>
              <CoinProvider>
                <NavigationContainer theme={theme}>
                  <AppNavigator />
                  <Toast />
                </NavigationContainer>
              </CoinProvider>
            </PaperProvider>
          </CategoryProvider>
        )}
      </ThemeContext.Consumer>
    </ThemeProvider>
  );
}
