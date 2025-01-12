import React, { useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message'; // Import Toast for feedback
import { useFocusEffect } from '@react-navigation/native';

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { theme } = useContext(ThemeContext);
  const [categories, setCategories] = useState({});
  const [customItem, setCustomItem] = useState(''); // State for custom item input

  // Fetch categories linked to the active organization
  const fetchCategories = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }

      const allCategories = JSON.parse(await AsyncStorage.getItem('categories')) || [];
      const filteredCategories = allCategories.filter(category => category.orgId === activeOrgId);
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Failed to load categories from storage', error);
    }
  };

  // Fetch categories whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  // Handle adding a custom item
  const handleAddCustomItem = async (categoryName) => {
    if (customItem.trim()) {
      try {
        const activeOrgId = await AsyncStorage.getItem('activeOrgId');
        if (!activeOrgId) {
          Alert.alert('Error', 'No active organization selected');
          return;
        }

        const storedCustomItemsKey = `customItems_${activeOrgId}_${bar.id}`;
        const storedCustomItems = await AsyncStorage.getItem(storedCustomItemsKey);
        const customItems = storedCustomItems ? JSON.parse(storedCustomItems) : [];

        const newItem = { name: customItem, categoryName, missing: 0 };
        const updatedCustomItems = [...customItems, newItem];
        await AsyncStorage.setItem(storedCustomItemsKey, JSON.stringify(updatedCustomItems));

        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `${customItem} has been added to ${categoryName}`,
          position: 'top',
        });
        setCustomItem('');
      } catch (error) {
        console.error('Failed to add custom item', error);
      }
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a valid item name.' });
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.colors.text }}>
        {bar.name} Inventory
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
      {categories.length > 0 ? (
  categories.map((category, index) => (
    <TouchableOpacity
      key={index}
      style={{
        padding: 20,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: theme.colors.surfaceVariant,
        alignItems: 'center',
      }}
      onPress={() =>
        navigation.navigate('CategoryList', {
          categoryName: category.name, // Pass the correct category name
          bar,
          categories,
        })
      }
    >
      <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
        View {category.name} {/* Display the correct category name */}
      </Text>
    </TouchableOpacity>
  ))
) : (
  <Text style={{ textAlign: 'center', color: theme.colors.text }}>No categories available.</Text>
)}


        <TouchableOpacity
          style={{
            padding: 20,
            borderRadius: 8,
            marginBottom: 20,
            alignItems: 'center',
            backgroundColor: theme.colors.surfaceVariant,
          }}
          onPress={() => navigation.navigate('MissingItems', { bar })}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
            View Missing Items
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Item Input and Button */}
      <View style={{ paddingTop: 10, paddingBottom:20 }}>
        <TextInput
          style={{
            padding: 15,
            borderColor: theme.colors.outline,
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 10,
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceVariant,
          }}
          placeholder="Enter custom item name"
          placeholderTextColor={theme.colors.onSurface}
          value={customItem}
          onChangeText={setCustomItem}
        />

        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
            alignItems: 'center',
          }}
          onPress={handleAddCustomItem}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
            Add Custom Item
          </Text>
        </TouchableOpacity>
      </View>

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
};

export default BarDetailScreen;
