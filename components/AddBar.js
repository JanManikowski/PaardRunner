import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Alert, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome } from '@expo/vector-icons';

const AddBar = ({ navigation }) => {
  const [barName, setBarName] = useState('');
  const [numShelves, setNumShelves] = useState('');
  const [numFridges, setNumFridges] = useState('');
  const [focusedField, setFocusedField] = useState('');

  const addBarToStorage = async () => {
    if (barName.trim() === '' || numShelves.trim() === '' || numFridges.trim() === '') {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    try {
      const bars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      bars.push({ name: barName, numShelves: parseInt(numShelves), numFridges: parseInt(numFridges), fridges: [], shelves: [] });
      await AsyncStorage.setItem('bars', JSON.stringify(bars));
      Alert.alert('Success', 'Bar added successfully');
      setBarName('');
      setNumShelves('');
      setNumFridges('');
      navigation.navigate('Home');
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
      backgroundColor: '#F8F8F8',
    }}>
      <Text style={{
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
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
        borderColor: focusedField === 'barName' ? '#007BFF' : '#CCCCCC',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#EDEDED',
        boxShadow: focusedField === 'barName' ? '0 0 5px rgba(0, 123, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}>
        <FontAwesome name="glass" size={18} color="#777" style={{ marginRight: 10 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, padding: 12 }}
          placeholder="Enter bar name"
          placeholderTextColor="#666"
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
        borderColor: focusedField === 'numShelves' ? '#007BFF' : '#CCCCCC',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#EDEDED',
        boxShadow: focusedField === 'numShelves' ? '0 0 5px rgba(0, 123, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}>
        <FontAwesome name="archive" size={18} color="#777" style={{ marginRight: 10 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, padding: 12 }}
          placeholder="Enter number of shelves"
          placeholderTextColor="#666"
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
        borderColor: focusedField === 'numFridges' ? '#007BFF' : '#CCCCCC',
        borderWidth: 1,
        borderRadius: 10,
        backgroundColor: '#EDEDED',
        boxShadow: focusedField === 'numFridges' ? '0 0 5px rgba(0, 123, 255, 0.5)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s ease',
      }}>
        <FontAwesome name="snowflake-o" size={18} color="#777" style={{ marginRight: 10 }} />
        <TextInput
          style={{ flex: 1, fontSize: 16, padding: 12 }}
          placeholder="Enter number of fridges"
          placeholderTextColor="#666"
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
          backgroundColor: '#007BFF',
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
        <Text style={{ color: '#FFF', fontSize: 16, fontWeight: 'bold' }}>Add Bar</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddBar;
