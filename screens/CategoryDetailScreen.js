import React, { useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';  // Import useFocusEffect
import DraggableFlatList from 'react-native-draggable-flatlist';
import { CategoryContext } from '../contexts/CategoryContext';  // Access category context
import { ThemeContext } from '../contexts/ThemeContext';       // Access theme context

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName } = route.params;
  const { categories, updateCategoryItems, removeItemFromCategory } = useContext(CategoryContext);  // Added `updateCategoryItems`
  const { theme } = useContext(ThemeContext);
  const [items, setItems] = useState(categories[categoryName] || []);  // Initialize state with category items

  // Function to handle drag-and-drop reorder
  const handleDragEnd = ({ data }) => {
    setItems(data);  // Update local state
    updateCategoryItems(categoryName, data);  // Save new order to context
  };

  // UseFocusEffect to refresh the items every time the screen is focused
  useFocusEffect(
    useCallback(() => {
      if (categories[categoryName]) {
        setItems(categories[categoryName]);  // Refresh the category items on focus
      }
    }, [categories, categoryName])
  );

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
            onLongPress={drag}  // Start drag on long press
          >
            {/* Display item image */}
            <Image
              source={item.image ? { uri: item.image } : require('../assets/placeholder.jpg')}
              style={{ width: 50, height: 50, marginRight: 10, borderRadius: 5 }}
            />

            {/* Display item details */}
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: theme.colors.text }}>{item.name}</Text>
              <Text style={{ color: theme.colors.text }}>Max: {item.maxAmount}</Text>
            </View>

            {/* Buttons for delete and edit */}
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.error,
                padding: 5,
                borderRadius: 5,
                marginLeft: 10,
              }}
              onPress={() => removeItemFromCategory(categoryName, item.name)}  // Remove item
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
              onPress={() => navigation.navigate('ItemEditor', { categoryName, item })}  // Navigate to ItemEditor
            >
              <Text style={{ color: theme.colors.onPrimary }}>Edit</Text>
            </TouchableOpacity>
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
        onPress={() => navigation.navigate('ItemEditor', { categoryName })}  // Navigate to add new item
      >
        <Text style={{ color: theme.colors.onPrimary }}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryDetailScreen;
 