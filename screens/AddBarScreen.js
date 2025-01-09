import React, { useState, useContext } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';

const AddBarScreen = ({ navigation }) => {
  const [barName, setBarName] = useState('');
  const [numShelves, setNumShelves] = useState('');
  const [numFridges, setNumFridges] = useState('');
  const [focusedField, setFocusedField] = useState('');
  const { theme } = useContext(ThemeContext);

  const addBarToStorage = async () => {
    if (!barName.trim() || !numShelves.trim() || !numFridges.trim()) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      console.log('Active Organization ID:', activeOrgId); // Debugging activeOrgId
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }

      // Retrieve bars for the active organization
      const allBars = JSON.parse(await AsyncStorage.getItem(`bars_${activeOrgId}`)) || [];
      console.log('Bars Before Update:', allBars); // Debugging bars before update

      // Check for duplicate bar names
      const isDuplicate = allBars.some((bar) => bar.name === barName);
      if (isDuplicate) {
        Alert.alert('Error', 'A bar with this name already exists');
        return;
      }

      // Create a new bar object
      const newBar = {
        name: barName,
        numShelves: parseInt(numShelves),
        numFridges: parseInt(numFridges),
        orgId: activeOrgId,
        fridges: [],
        shelves: [],
      };
      console.log('New Bar Object:', newBar); // Debugging new bar object

      // Save the updated bars list back to storage
      const updatedBars = [...allBars, newBar];
      await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(updatedBars));
      console.log('Bars After Update:', updatedBars); // Debugging bars after update

      Alert.alert('Success', 'Bar added successfully');

      // Reset form fields and navigate back
      setBarName('');
      setNumShelves('');
      setNumFridges('');
      navigation.navigate('ViewBars', { refresh: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to add bar');
      console.error('Error Adding Bar:', error); // Debugging error
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '80%',
          padding: 12,
          marginVertical: 10,
          borderColor: focusedField === 'numShelves' ? theme.colors.primary : theme.colors.border,
          borderWidth: 1,
          borderRadius: 10,
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
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
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '80%',
          padding: 12,
          marginVertical: 10,
          borderColor: focusedField === 'numFridges' ? theme.colors.primary : theme.colors.border,
          borderWidth: 1,
          borderRadius: 10,
          backgroundColor: theme.colors.surfaceVariant,
        }}
      >
        <FontAwesome name="snowflake-o" size={18} color={theme.colors.icon} style={{ marginRight: 10 }} />
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
