import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

const AddBarScreen = ({ navigation }) => {
  const [barName, setBarName] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const { theme } = useContext(ThemeContext);

  const addBarToStorage = async () => {
    if (!barName.trim()) {
      Alert.alert('Error', 'Bar name is required');
      return;
    }

    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }

      const allBars = JSON.parse(await AsyncStorage.getItem(`bars_${activeOrgId}`)) || [];
      const isDuplicate = allBars.some((bar) => bar.name === barName);
      if (isDuplicate) {
        Alert.alert('Error', 'A bar with this name already exists');
        return;
      }

      const newBar = {
        name: barName,
        orgId: activeOrgId,
      };

      const updatedBars = [...allBars, newBar];
      await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(updatedBars));
      Alert.alert('Success', 'Bar added successfully');

      setBarName('');
      navigation.navigate('ViewBars', { refresh: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to add bar');
      console.error(error);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          color: theme.colors.text,
          marginBottom: 30,
          textAlign: 'center',
        }}
      >
        Add New Bar
      </Text>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '80%',
          padding: 12,
          marginVertical: 10,
          borderColor: focusedField === 'barName' ? theme.colors.primary : theme.colors.border,
          borderWidth: 1,
          borderRadius: 10,
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
        <FontAwesome name="glass" size={18} color={theme.colors.icon} style={{ marginRight: 10 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, padding: 12, color: theme.colors.text }}
          placeholder="Enter bar name"
          placeholderTextColor={theme.colors.placeholder}
          value={barName}
          onChangeText={setBarName}
          onFocus={() => setFocusedField('barName')}
          onBlur={() => setFocusedField('')}
        />
      </View>
      <TouchableOpacity
        style={{
          width: '80%',
          padding: 15,
          marginVertical: 20,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          alignItems: 'center',
        }}
        onPress={addBarToStorage}
        activeOpacity={0.8}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16, fontWeight: 'bold' }}>Add Bar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddBarScreen;
