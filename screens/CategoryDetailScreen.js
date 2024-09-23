import React, { useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { CategoryContext } from '../contexts/CategoryContext';  // Access category context
import { ThemeContext } from '../contexts/ThemeContext';       // Access theme context

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName } = route.params;
  const { categories, removeItemFromCategory } = useContext(CategoryContext);
  const { theme } = useContext(ThemeContext);

  const items = categories[categoryName] || [];

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        {categoryName} Items
      </Text>

      <ScrollView>
        {items.length > 0 ? (
          items.map((item, index) => (
            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
              {/* Display item image */}
              {item.image ? (
                <Image source={{ uri: item.image }} style={{ width: 50, height: 50, marginRight: 10 }} />
              ) : (
                <Image source={require('../assets/placeholder.jpg')} style={{ width: 50, height: 50, marginRight: 10 }} />
              )}

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
                onPress={() => navigation.navigate('ItemDetail', { categoryName, item })}  // Navigate to ItemDetail
              >
                <Text style={{ color: theme.colors.onPrimary }}>Edit</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={{ color: theme.colors.text }}>No items available in this category.</Text>
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
        onPress={() => navigation.navigate('ItemDetail', { categoryName })}  // Navigate to add new item
      >
        <Text style={{ color: theme.colors.onPrimary }}>Add New Item</Text>
      </TouchableOpacity>
    </View>
  );
};

export default CategoryDetailScreen;
