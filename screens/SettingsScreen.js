import React, { useContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 30 }}>
        Settings
      </Text>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('AddBar')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Add Bar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('ManageBars')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Manage Bars</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          alignItems: 'center',
        }}
        onPress={toggleTheme}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>
          Switch to {theme.dark ? 'Light Mode' : 'Dark Mode'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;
