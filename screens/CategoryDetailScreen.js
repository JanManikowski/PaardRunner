import React, { useContext, useState, useCallback, useEffect, act } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName, orgId, refresh } = route.params;
  const { theme } = useContext(ThemeContext);

  const [items, setItems] = useState([]);
  const [manageMode, setManageMode] = useState(false); // Toggle to show/hide Edit & Delete buttons

  // Reorder logic
  const handleDragEnd = async ({ data }) => {
    setItems(data);
    await saveItemsToStorage(data);
  };

  // Fetch items when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [categoryName])
  );

  // Also refresh if `refresh` param is passed
  useEffect(() => {
    if (refresh) {
      fetchItems();
    }
  }, [refresh]);

  // Fetch items from AsyncStorage for the given category & org
  const fetchItems = async () => {
    try {
      const activeOrgId = orgId || (await AsyncStorage.getItem('activeOrgId'));
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }

      const storedItems = await AsyncStorage.getItem(`items_${activeOrgId}`);
      const allItems = storedItems ? JSON.parse(storedItems) : [];

      const filteredItems = allItems.filter(
        (item) => item.categoryName === categoryName && item.orgId === activeOrgId
      );
      setItems(filteredItems);
    } catch (error) {
      console.error('Failed to load items from storage', error);
    }
  };

  // Save updated item order to AsyncStorage
  const saveItemsToStorage = async (updatedItems) => {
    try {
      const storedItems = await AsyncStorage.getItem('items');
      const allItems = storedItems ? JSON.parse(storedItems) : [];

      const activeOrgId = orgId || (await AsyncStorage.getItem('activeOrgId'));
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }

      // Remove old items for this category, then concat the updated ones
      const updatedGlobalItems = allItems
        .filter(
          (item) =>
            !(item.categoryName === categoryName && item.orgId === activeOrgId)
        )
        .concat(updatedItems);

      await AsyncStorage.setItem(`items_${activeOrgId}`, JSON.stringify(updatedGlobalItems));
    } catch (error) {
      console.error('Failed to save items to storage', error);
    }
  };

  // Remove an item from this category
  const removeItem = async (itemName) => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      const storedItems = await AsyncStorage.getItem('items');
      const allItems = storedItems ? JSON.parse(storedItems) : [];

      // Filter out the item globally
      const updatedItems = allItems.filter(
        (item) =>
          item.name !== itemName ||
          item.orgId !== activeOrgId ||
          item.categoryName !== categoryName
      );

      // Save updated global items
      await AsyncStorage.setItem(`items_${activeOrgId}`, JSON.stringify(updatedItems));

      // Update local state
      const filteredItems = updatedItems.filter(
        (item) =>
          item.orgId === activeOrgId && item.categoryName === categoryName
      );
      setItems(filteredItems);
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {/* Category Title */}
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 10,
          color: theme.colors.text,
          textAlign: 'center',
        }}
      >
        {categoryName} Items
      </Text>

      {/* Toggle Manage Mode Button */}
      <TouchableOpacity
        style={{
          backgroundColor: manageMode ? theme.colors.error : theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={() => setManageMode(!manageMode)}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          {manageMode ? 'Done' : 'Manage Items'}
        </Text>
      </TouchableOpacity>

      {/* Draggable List */}
      <DraggableFlatList
        data={items}
        keyExtractor={(item, index) => `draggable-item-${index}`}
        onDragEnd={handleDragEnd}
        renderItem={({ item, drag, isActive }) => (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 10,
              backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
              borderRadius: 8,
              padding: 10,
              // Shadow / elevation for a card-like feel
              shadowColor: theme.colors.shadow || '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
            onLongPress={drag} // Start drag on long press
          >
            {/* Display item image */}
            <Image
              source={item.image ? { uri: item.image } : require('../assets/placeholder.jpg')}
              style={{ width: 50, height: 50, marginRight: 10, borderRadius: 5, backgroundColor:"white" }}
            />

            {/* Display item details */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: theme.colors.text }}>
                {item.name}
              </Text>
              <Text style={{ color: theme.colors.text }}>
                Max: {item.maxAmount}
              </Text>
            </View>

            {/* Show Edit / Delete buttons only if in manageMode */}
            {manageMode && (
              <>
                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.error,
                    padding: 5,
                    borderRadius: 5,
                    marginLeft: 10,
                  }}
                  onPress={() => removeItem(item.name)}
                >
                  <Text style={{ color: theme.colors.onError }}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: theme.colors.primary,
                    padding: 5,
                    borderRadius: 5,
                    marginLeft: 10,
                  }}
                  onPress={() => navigation.navigate('ItemEditor', { categoryName, item })}
                >
                  <Text style={{ color: theme.colors.onPrimary }}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
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
        onPress={() => navigation.navigate('ItemEditor', { categoryName })}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          Add New Item
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryDetailScreen;
