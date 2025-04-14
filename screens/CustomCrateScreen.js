import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

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
        const activeOrgId = await AsyncStorage.getItem('activeOrgId');
        if (!activeOrgId) {
          Alert.alert('Error', 'No active organization selected.');
          return;
        }
        const storedCategories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
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
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        setCrates([]);
        return;
      }
      const storedCrates = JSON.parse(await AsyncStorage.getItem(`customCrates_${activeOrgId}`)) || [];
      const filteredCrates = storedCrates.filter((crate) => crate.orgId === activeOrgId);
      setCrates(filteredCrates);
    } catch (error) {
      console.error('Error fetching crates:', error);
    }
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
  
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected.');
        return;
      }
  
      const newCrate = {
        id: Date.now().toString(),
        name: crateName.trim(),
        category: selectedCategory,
        maxItems: parseInt(maxItems),
        orgId: activeOrgId,
      };
  
      const storedCrates = JSON.parse(await AsyncStorage.getItem(`customCrates_${activeOrgId}`)) || [];
      const updatedCrates = [...storedCrates, newCrate];
      await AsyncStorage.setItem(`customCrates_${activeOrgId}`, JSON.stringify(updatedCrates));
  
      fetchCrates();
      setCrateName('');
      setSelectedCategory('');
      setMaxItems('');
      Alert.alert('Success', 'Crate added successfully.');
    } catch (error) {
      console.error('Error adding crate:', error);
      Alert.alert('Error', 'Failed to add crate.');
    }
  };
  

  const handleDeleteCrate = async (crateId) => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected.');
        return;
      }
      const storedCrates = JSON.parse(await AsyncStorage.getItem(`customCrates_${activeOrgId}`)) || [];
      const updatedCrates = storedCrates.filter((crate) => crate.id !== crateId);
      await AsyncStorage.setItem(`customCrates_${activeOrgId}`, JSON.stringify(updatedCrates));
      fetchCrates();
      Alert.alert('Success', 'Crate deleted successfully.');
    } catch (error) {
      console.error('Error deleting crate:', error);
      Alert.alert('Error', 'Failed to delete crate.');
    }
  };
  

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Custom Crates</Text>

      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Crate Name"
          placeholderTextColor={theme.colors.onSurface}
          value={crateName}
          onChangeText={setCrateName}
          style={[styles.input, { borderColor: theme.colors.outline, color: theme.colors.text }]}
        />
        <View style={[styles.pickerContainer, { borderColor: theme.colors.outline }]}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(itemValue) => setSelectedCategory(itemValue)}
            style={[styles.picker, { color: theme.colors.text }]}
          >
            <Picker.Item label="Select a Category" value="" />
            {categories.map((category) => (
              <Picker.Item key={category.id} label={category.name} value={category.name} />
            ))}
          </Picker>
        </View>
        <TextInput
          placeholder="Maximum Items"
          placeholderTextColor={theme.colors.onSurface}
          value={maxItems}
          onChangeText={setMaxItems}
          keyboardType="numeric"
          style={[styles.input, { borderColor: theme.colors.outline, color: theme.colors.text }]}
        />
        <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.colors.primary }]} onPress={handleAddCrate}>
          <Text style={[styles.addButtonText, { color: theme.colors.background }]}>Add Crate</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={crates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.crateCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <View>
              <Text style={[styles.crateText, { color: theme.colors.text }]}>{item.name}</Text>
              <Text style={[styles.crateSubText, { color: theme.colors.text }]}>{item.category} (Max: {item.maxItems})</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteCrate(item.id)}>
              <Text style={[styles.deleteText, { color: theme.colors.error }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  addButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: 20,
  },
  crateCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  crateText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  crateSubText: {
    fontSize: 16,
    marginTop: 4,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomCratesScreen;
