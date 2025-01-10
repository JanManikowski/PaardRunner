import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, FlatList, TouchableOpacity } from 'react-native';
import {Picker} from '@react-native-picker/picker'
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CustomCratesScreen = () => {
  const { theme } = useContext(ThemeContext);
  const [crates, setCrates] = useState([]);
  const [crateName, setCrateName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [maxItems, setMaxItems] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Get active organization ID from AsyncStorage
        const activeOrgId = await AsyncStorage.getItem('activeOrgId');
        if (!activeOrgId) {
          Alert.alert('Error', 'No active organization selected.');
          return;
        }

        // Fetch categories for the active organization from local storage
        const storedCategories = JSON.parse(await AsyncStorage.getItem('categories')) || [];
        const filteredCategories = storedCategories.filter(
          (category) => category.orgId === activeOrgId
        );

        setCategories(filteredCategories);
      } catch (error) {
        console.error('Error fetching categories from local storage:', error);
        Alert.alert('Error', 'Failed to load categories.');
      }
    };

    fetchCategories();
    fetchCrates();
  }, []);

  const fetchCrates = async () => {
    const storedCrates = JSON.parse(await AsyncStorage.getItem('customCrates')) || [];
    setCrates(storedCrates);
  };

  const handleAddCrate = async () => {
    if (!crateName.trim() || !selectedCategory || !maxItems.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    if (isNaN(maxItems) || parseInt(maxItems) <= 0) {
      Alert.alert('Error', 'Maximum items must be a positive number.');
      return;
    }

    const newCrate = {
      id: Date.now().toString(),
      name: crateName.trim(),
      category: selectedCategory,
      maxItems: parseInt(maxItems),
    };

    const updatedCrates = [...crates, newCrate];
    setCrates(updatedCrates);

    // Save to AsyncStorage
    await AsyncStorage.setItem('customCrates', JSON.stringify(updatedCrates));

    setCrateName('');
    setSelectedCategory('');
    setMaxItems('');
    Alert.alert('Success', 'Crate added successfully.');
  };

  const handleDeleteCrate = async (crateId) => {
    const updatedCrates = crates.filter((crate) => crate.id !== crateId);
    setCrates(updatedCrates);
    await AsyncStorage.setItem('customCrates', JSON.stringify(updatedCrates));
    Alert.alert('Success', 'Crate deleted successfully.');
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Custom Crates</Text>

      <TextInput
        placeholder="Crate Name"
        placeholderTextColor={theme.colors.onSurface}
        value={crateName}
        onChangeText={setCrateName}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 5,
          padding: 10,
          marginBottom: 10,
          color: theme.colors.text,
        }}
      />
      <Picker
        selectedValue={selectedCategory}
        onValueChange={(itemValue) => setSelectedCategory(itemValue)}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 5,
          marginBottom: 10,
          color: theme.colors.text,
        }}
      >
        <Picker.Item label="Select a Category" value="" />
        {categories.map((category) => (
          <Picker.Item key={category.id} label={category.name} value={category.name} />
        ))}
      </Picker>
      <TextInput
        placeholder="Maximum Items"
        placeholderTextColor={theme.colors.onSurface}
        value={maxItems}
        onChangeText={setMaxItems}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 5,
          padding: 10,
          marginBottom: 20,
          color: theme.colors.text,
        }}
      />
      <Button title="Add Crate" onPress={handleAddCrate} />

      <FlatList
        data={crates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
              marginVertical: 5,
              backgroundColor: theme.colors.surfaceVariant,
              borderRadius: 5,
            }}
          >
            <Text style={{ color: theme.colors.text }}>
              {item.name} - {item.category} (Max: {item.maxItems})
            </Text>
            <TouchableOpacity onPress={() => handleDeleteCrate(item.id)}>
              <Text style={{ color: theme.colors.error }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default CustomCratesScreen;
