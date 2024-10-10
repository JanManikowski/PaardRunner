import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext'; // Import ThemeContext

const AddBarScreen = ({ navigation }) => {
  const [barName, setBarName] = useState('');
  const [numShelves, setNumShelves] = useState('');
  const [numFridges, setNumFridges] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const { theme } = useContext(ThemeContext); // Access theme from ThemeContext

  const addBarToStorage = async () => {
    if (barName.trim() === '' || numShelves.trim() === '' || numFridges.trim() === '') {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      // Retrieve active organization ID from AsyncStorage
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }

      // Get the bars linked to the active organization
      const bars = JSON.parse(await AsyncStorage.getItem(`bars_${activeOrgId}`)) || [];
      const newBar = { name: barName, numShelves: parseInt(numShelves), numFridges: parseInt(numFridges), fridges: [], shelves: [] };
      const updatedBars = [...bars, newBar];

      // Save the updated bars list to the correct organization key in AsyncStorage
      await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(updatedBars));
      Alert.alert('Success', 'Bar added successfully');

      // Reset form fields
      setBarName('');
      setNumShelves('');
      setNumFridges('');

      // Navigate back to ViewBarsScreen and refresh
      navigation.navigate('ViewBars', { refresh: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to add bar');
      console.error(error);
    }
  };

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
      backgroundColor: theme.colors.background,
    }}>
      <Text style={{
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 30,
        textAlign: 'center',
      }}>
        Add New Bar
      </Text>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        padding: 12,
        marginVertical: 10,
        borderColor: focusedField === 'barName' ? theme.colors.primary : theme.colors.border,
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceVariant,
        boxShadow: focusedField === 'barName' ? '0 0 5px rgba(0, 123, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}>
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
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        padding: 12,
        marginVertical: 10,
        borderColor: focusedField === 'numShelves' ? theme.colors.primary : theme.colors.border,
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceVariant,
        boxShadow: focusedField === 'numShelves' ? '0 0 5px rgba(0, 123, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}>
        <FontAwesome name="archive" size={18} color={theme.colors.icon} style={{ marginRight: 10 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, padding: 12, color: theme.colors.text }}
          placeholder="Enter number of shelves"
          placeholderTextColor={theme.colors.placeholder}
          value={numShelves}
          onChangeText={setNumShelves}
          keyboardType="numeric"
          onFocus={() => setFocusedField('numShelves')}
          onBlur={() => setFocusedField('')}
        />
      </View>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        width: '80%',
        padding: 12,
        marginVertical: 10,
        borderColor: focusedField === 'numFridges' ? theme.colors.primary : theme.colors.border,
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: theme.colors.surfaceVariant,
        boxShadow: focusedField === 'numFridges' ? '0 0 5px rgba(0, 123, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}>
        <FontAwesome name="snowflake-o" size={18} color={theme.colors.text} style={{ marginRight: 10 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, padding: 12, color: theme.colors.text }}
          placeholder="Enter number of fridges"
          placeholderTextColor={theme.colors.placeholder}
          value={numFridges}
          onChangeText={setNumFridges}
          keyboardType="numeric"
          onFocus={() => setFocusedField('numFridges')}
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
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          transition: 'all 0.3s ease',
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
