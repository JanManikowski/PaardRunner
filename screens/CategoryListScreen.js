import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { CategoryContext } from '../contexts/CategoryContext';

const CategoryListScreen = ({ route, navigation }) => {
  const { categoryName, bar } = route.params;  // Get the category name and bar from navigation params
  const { categories } = useContext(CategoryContext);  // Access categories from the context
  const { theme } = useContext(ThemeContext);
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Get items from the selected category
    if (categories[categoryName]) {
      setItems(categories[categoryName]);
    }
  }, [categoryName, categories]);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.colors.text }}>
        Items in {categoryName}
      </Text>

      <ScrollView>
        {items.length > 0 ? (
          items.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={{
                padding: 20,
                borderRadius: 8,
                marginBottom: 10,
                backgroundColor: theme.colors.surfaceVariant,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => navigation.navigate('ItemDetail', { item, categoryName, bar })} 
            >
              {/* Display item image */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: 50, height: 50, marginRight: 10 }} />
              ) : (
                <Image source={require('../assets/placeholder.jpg')} style={{ width: 50, height: 50, marginRight: 10 }} />
              )}

              {/* Display item name */}
              <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>{item.name}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: theme.colors.text }}>No items in this category.</Text>
        )}
      </ScrollView>

      {/* Button to add a new item */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginTop: 20,
        }}
        onPress={() => navigation.navigate('ItemDetail', { categoryName, bar })}  // Navigate to add a new item
      >
        <Text style={{ color: theme.colors.onPrimary }}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryListScreen;
