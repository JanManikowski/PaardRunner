import React, { createContext, useState, useEffect, useMemo } from 'react';
import { DefaultTheme as PaperDefaultTheme, DarkTheme as PaperDarkTheme } from 'react-native-paper';
import { DefaultTheme as NavigationDefaultTheme, DarkTheme as NavigationDarkTheme } from '@react-navigation/native';
import merge from 'deepmerge';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Custom Light Theme Colors
const CustomLightColors = {
  primary: "rgb(0, 104, 116)",
  onPrimary: "rgb(255, 255, 255)",
  primaryContainer: "rgb(151, 240, 255)",
  onPrimaryContainer: "rgb(0, 31, 36)",
  secondary: "rgb(179, 41, 36)",
  onSecondary: "rgb(255, 255, 255)",
  secondaryContainer: "rgb(255, 218, 214)",
  onSecondaryContainer: "rgb(65, 0, 2)",
  tertiary: "rgb(170, 53, 45)",
  onTertiary: "rgb(255, 255, 255)",
  tertiaryContainer: "rgb(255, 218, 214)",
  onTertiaryContainer: "rgb(65, 0, 2)",
  error: "rgb(186, 26, 26)",
  onError: "rgb(255, 255, 255)",
  errorContainer: "rgb(255, 218, 214)",
  onErrorContainer: "rgb(65, 0, 2)",
  background: "rgb(250, 253, 253)",
  onBackground: "rgb(25, 28, 29)",
  surface: "rgb(250, 253, 253)",
  onSurface: "rgb(25, 28, 29)",
  surfaceVariant: "rgb(219, 228, 230)",
  onSurfaceVariant: "rgb(63, 72, 74)",
  outline: "rgb(111, 121, 122)",
  outlineVariant: "rgb(191, 200, 202)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(46, 49, 50)",
  inverseOnSurface: "rgb(239, 241, 241)",
  inversePrimary: "rgb(79, 216, 235)",
  elevation: {
    level0: "transparent",
    level1: "rgb(238, 246, 246)",
    level2: "rgb(230, 241, 242)",
    level3: "rgb(223, 237, 238)",
    level4: "rgb(220, 235, 237)",
    level5: "rgb(215, 232, 234)"
  },
  surfaceDisabled: "rgba(25, 28, 29, 0.12)",
  onSurfaceDisabled: "rgba(25, 28, 29, 0.38)",
  backdrop: "rgba(41, 50, 52, 0.4)"
};

// Custom Dark Theme Colors
const CustomDarkColors = {
  primary: "rgb(79, 216, 235)",
  onPrimary: "rgb(0, 54, 61)",
  primaryContainer: "rgb(0, 79, 88)",
  onPrimaryContainer: "rgb(151, 240, 255)",
  secondary: "rgb(255, 180, 171)",
  onSecondary: "rgb(105, 0, 5)",
  secondaryContainer: "rgb(144, 12, 15)",
  onSecondaryContainer: "rgb(255, 218, 214)",
  tertiary: "rgb(255, 180, 171)",
  onTertiary: "rgb(104, 1, 5)",
  tertiaryContainer: "rgb(137, 28, 24)",
  onTertiaryContainer: "rgb(255, 218, 214)",
  error: "rgb(255, 180, 171)",
  onError: "rgb(105, 0, 5)",
  errorContainer: "rgb(147, 0, 10)",
  onErrorContainer: "rgb(255, 180, 171)",
  background: "rgb(25, 28, 29)",
  onBackground: "rgb(225, 227, 227)",
  surface: "rgb(25, 28, 29)",
  onSurface: "rgb(225, 227, 227)",
  surfaceVariant: "rgb(63, 72, 74)",
  onSurfaceVariant: "rgb(191, 200, 202)",
  outline: "rgb(137, 146, 148)",
  outlineVariant: "rgb(63, 72, 74)",
  shadow: "rgb(0, 0, 0)",
  scrim: "rgb(0, 0, 0)",
  inverseSurface: "rgb(225, 227, 227)",
  inverseOnSurface: "rgb(46, 49, 50)",
  inversePrimary: "rgb(0, 104, 116)",
  elevation: {
    level0: "transparent",
    level1: "rgb(28, 37, 39)",
    level2: "rgb(29, 43, 46)",
    level3: "rgb(31, 49, 52)",
    level4: "rgb(32, 51, 54)",
    level5: "rgb(33, 54, 58)"
  },
  surfaceDisabled: "rgba(225, 227, 227, 0.12)",
  onSurfaceDisabled: "rgba(225, 227, 227, 0.38)",
  backdrop: "rgba(41, 50, 52, 0.4)",
  text: "white"
};

// Custom Light Theme
const CustomLightTheme = merge(PaperDefaultTheme, {
  colors: CustomLightColors,
});

// Custom Dark Theme
const CustomDarkTheme = merge(PaperDarkTheme, {
  colors: CustomDarkColors,
});

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkTheme, setIsDarkTheme] = useState(false);

  useEffect(() => {
    const loadThemePreference = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('theme');
        if (storedTheme !== null) {
          setIsDarkTheme(storedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadThemePreference();
  }, []);

  const theme = useMemo(() => (isDarkTheme ? CustomDarkTheme : CustomLightTheme), [isDarkTheme]);

  const toggleTheme = async () => {
    const newTheme = !isDarkTheme;
    setIsDarkTheme(newTheme);

    try {
      await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
