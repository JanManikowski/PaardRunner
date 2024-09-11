// SettingsScreen.js
import React, { useContext } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 30 }}>
        Settings
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Text style={{ fontSize: 18, color: theme.colors.text }}>Dark Mode</Text>
        <Switch value={theme.dark} onValueChange={toggleTheme} />
      </View>

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
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('ManageBars')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Manage Bars</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SettingsScreen;
