import React from 'react';
import { ThemeProvider, ThemeContext } from './contexts/ThemeContext';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AppNavigator from './navigation/AppNavigator';
import { CategoryProvider } from './contexts/CategoryContext';

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
