import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddBar = ({ navigation }) => {
  const [barName, setBarName] = useState('');
  const [numShelves, setNumShelves] = useState('');
  const [numFridges, setNumFridges] = useState('');

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
    <View style={styles.container}>
      <Text style={styles.title}>Add New Bar</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter bar name"
        value={barName}
        onChangeText={setBarName}
      />
      <TextInput
        style={styles.input}
        placeholder="Enter number of shelves"
        value={numShelves}
        onChangeText={setNumShelves}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Enter number of fridges"
        value={numFridges}
        onChangeText={setNumFridges}
        keyboardType="numeric"
      />
      <Button title="Add Bar" onPress={addBarToStorage} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
});

export default AddBar;
