import React, { useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName } = route.params;
  const { theme } = useContext(ThemeContext);
  const [items, setItems] = useState([]);

  // Function to handle drag-and-drop reorder
  const handleDragEnd = async ({ data }) => {
    setItems(data);
    await saveItemsToStorage(data);
  };

  // UseFocusEffect to refresh the items every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [categoryName])
  );

  const fetchItems = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
  
      // Fetch all items globally
      const storedItems = await AsyncStorage.getItem('items');
      const allItems = storedItems ? JSON.parse(storedItems) : [];
  
      // Filter items by organization and category
      const filteredItems = allItems.filter(item => item.orgId === activeOrgId && item.categoryName === categoryName);
      setItems(filteredItems);
    } catch (error) {
      console.error('Failed to load items from storage', error);
    }
  };
  

  const saveItemsToStorage = async (items) => {
    try {
      // Retrieve active organization ID
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }

      // Save updated items list to AsyncStorage
      await AsyncStorage.setItem(`items_${activeOrgId}_${categoryName}`, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save items to storage', error);
    }
  };

  const removeItem = async (itemName) => {
    try {
      const filteredItems = items.filter(item => item.name !== itemName);
      setItems(filteredItems);
      await saveItemsToStorage(filteredItems);
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        {categoryName} Items
      </Text>

      {/* Draggable List */}
      <DraggableFlatList
        data={items}
        keyExtractor={(item, index) => `draggable-item-${index}`}
        onDragEnd={handleDragEnd}
        renderItem={({ item, drag, isActive }) => (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 10,
              backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
              padding: 10,
              borderRadius: 8,
            }}
            onLongPress={drag} // Start drag on long press
          >
            {/* Display item image */}
            <Image
              source={item.image ? { uri: item.image } : require('../assets/placeholder.jpg')}
              style={{ width: 50, height: 50, marginRight: 10, borderRadius: 5 }}
            />

            {/* Display item details */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: theme.colors.text }}>{item.name}</Text>
            </View>

            
          </TouchableOpacity>
        )}
      />

      {/* Button to add a new item */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginTop: 20,
        }}
        onPress={() => navigation.navigate('ItemEditor', { categoryName })} // Navigate to add new item
      >
        <Text style={{ color: theme.colors.onPrimary }}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryDetailScreen;