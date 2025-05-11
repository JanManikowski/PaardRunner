import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  StyleSheet,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const CustomCratesScreen = () => {
  const { theme } = useContext(ThemeContext);

  const [crates, setCrates] = useState([]);
  const [crateName, setCrateName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);
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
        const storedCategories =
          JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) ||
          [];
        const filtered = storedCategories.filter(
          (cat) => cat.orgId === activeOrgId
        );
        setCategories(filtered);
      } catch (e) {
        console.error(e);
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
      const stored =
        JSON.parse(await AsyncStorage.getItem(`customCrates_${activeOrgId}`)) ||
        [];
      const filtered = stored.filter((c) => c.orgId === activeOrgId);
      setCrates(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleCategory = (name) => {
    setSelectedCategories((prev) =>
      prev.includes(name)
        ? prev.filter((c) => c !== name)
        : [...prev, name]
    );
  };

  const handleAddCrate = async () => {
    if (!crateName.trim() || selectedCategories.length === 0 || !maxItems.trim()) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (isNaN(maxItems) || parseInt(maxItems, 10) <= 0) {
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
        categories: selectedCategories,   // now an array
        maxItems: parseInt(maxItems, 10),
        orgId: activeOrgId,
      };
      const stored =
        JSON.parse(await AsyncStorage.getItem(`customCrates_${activeOrgId}`)) ||
        [];
      const updated = [...stored, newCrate];
      await AsyncStorage.setItem(
        `customCrates_${activeOrgId}`,
        JSON.stringify(updated)
      );
      fetchCrates();
      setCrateName('');
      setSelectedCategories([]);
      setMaxItems('');
      Alert.alert('Success', 'Crate added successfully.');
    } catch (e) {
      console.error(e);
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
      const stored =
        JSON.parse(await AsyncStorage.getItem(`customCrates_${activeOrgId}`)) ||
        [];
      const updated = stored.filter((c) => c.id !== crateId);
      await AsyncStorage.setItem(
        `customCrates_${activeOrgId}`,
        JSON.stringify(updated)
      );
      fetchCrates();
      Alert.alert('Success', 'Crate deleted successfully.');
    } catch (e) {
      console.error(e);
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
          style={[
            styles.input,
            { borderColor: theme.colors.outline, color: theme.colors.text },
          ]}
        />

        {/* Multi-select categories list */}
        <View style={styles.multiSelectContainer}>
          <Text style={[styles.multiSelectLabel, { color: theme.colors.text }]}>
            Select Categories:
          </Text>
          {categories.map((cat) => (
            <View key={cat.id} style={styles.categoryOption}>
              <Text style={[styles.categoryLabel, { color: theme.colors.text }]}>
                {cat.name}
              </Text>
              <Switch
                value={selectedCategories.includes(cat.name)}
                onValueChange={() => toggleCategory(cat.name)}
                trackColor={{ true: theme.colors.primary }}
              />
            </View>
          ))}
        </View>

        <TextInput
          placeholder="Maximum Items"
          placeholderTextColor={theme.colors.onSurface}
          value={maxItems}
          onChangeText={setMaxItems}
          keyboardType="numeric"
          style={[
            styles.input,
            { borderColor: theme.colors.outline, color: theme.colors.text },
          ]}
        />

        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.colors.primary }]}
          onPress={handleAddCrate}
        >
          <Text style={[styles.addButtonText, { color: theme.colors.background }]}>
            Add Crate
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={crates}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const cats = Array.isArray(item.categories)
            ? item.categories.join(', ')
            : item.category;
          return (
            <View
              style={[styles.crateCard, { backgroundColor: theme.colors.surfaceVariant }]}
            >
              <View>
                <Text style={[styles.crateText, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.crateSubText, { color: theme.colors.text }]}>
                  {cats} (Max: {item.maxItems})
                </Text>
              </View>
              <TouchableOpacity onPress={() => handleDeleteCrate(item.id)}>
                <Text style={[styles.deleteText, { color: theme.colors.error }]}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          );
        }}
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
  multiSelectContainer: {
    marginBottom: 12,
  },
  multiSelectLabel: {
    fontSize: 16,
    marginBottom: 6,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  categoryLabel: {
    fontSize: 16,
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
