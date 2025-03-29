// CategoryDetailScreen.js
import React, { useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName } = route.params;
  const { theme } = useContext(ThemeContext);

  const [items, setItems] = useState([]);
  const [manageMode, setManageMode] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState(null);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [categoryName])
  );

  const fetchItems = async () => {
    try {
      const orgId = await AsyncStorage.getItem('activeOrgId');
      setActiveOrgId(orgId);
      const storedCategories = JSON.parse(await AsyncStorage.getItem(`categories_${orgId}`)) || [];
      const category = storedCategories.find(cat => cat.name === categoryName);
      setItems(category?.items || []);
    } catch (error) {
      console.error('Failed to fetch items:', error);
    }
  };

  const handleDragEnd = async ({ data }) => {
    setItems(data);
    await saveItemsToStorage(data);
  };

  const saveItemsToStorage = async (updatedItems) => {
    try {
      const storedCategories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      const updatedCategories = storedCategories.map(cat =>
        cat.name === categoryName ? { ...cat, items: updatedItems } : cat
      );
      await AsyncStorage.setItem(`categories_${activeOrgId}`, JSON.stringify(updatedCategories));
    } catch (error) {
      console.error('Failed to save items:', error);
    }
  };

  const removeItem = async (itemName) => {
    const updatedItems = items.filter(item => item.name !== itemName);
    setItems(updatedItems);
    await saveItemsToStorage(updatedItems);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10, color: theme.colors.text, textAlign: 'center' }}>
        {categoryName} Items
      </Text>

      <TouchableOpacity
        style={{ backgroundColor: manageMode ? theme.colors.error : theme.colors.primary, padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 20 }}
        onPress={() => setManageMode(!manageMode)}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          {manageMode ? 'Done' : 'Manage Items'}
        </Text>
      </TouchableOpacity>

      <DraggableFlatList
        data={items}
        keyExtractor={(item) => item.name}
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
              shadowColor: theme.colors.shadow || '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 3,
            }}
            onLongPress={drag}
          >
            <Image
              source={item.image ? { uri: item.image } : require('../assets/placeholder.jpg')}
              style={{ width: 50, height: 50, marginRight: 10, borderRadius: 5, backgroundColor: "white" }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: theme.colors.text }}>{item.name}</Text>
              <Text style={{ color: theme.colors.text }}>Max: {item.maxAmount}</Text>
            </View>

            {manageMode && (
              <>
                <TouchableOpacity
                  style={{ backgroundColor: theme.colors.error, padding: 5, borderRadius: 5, marginLeft: 10 }}
                  onPress={() => removeItem(item.name)}
                >
                  <Text style={{ color: theme.colors.onError }}>Delete</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ backgroundColor: theme.colors.primary, padding: 5, borderRadius: 5, marginLeft: 10 }}
                  onPress={() => navigation.navigate('ItemEditor', { categoryName, item })}
                >
                  <Text style={{ color: theme.colors.onPrimary }}>Edit</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Existing single item add button */}
      <TouchableOpacity
        style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 20 }}
        onPress={() => navigation.navigate('ItemEditor', { categoryName })}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>Add New Item</Text>
      </TouchableOpacity>

      {/* New multiple item add button */}
      <TouchableOpacity
        style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 10 }}
        onPress={() => navigation.navigate('MultiItemEditor', { categoryName })}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>Add Multiple Items</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryDetailScreen;
