import React, { useContext, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { CategoryContext } from '../contexts/CategoryContext';
import Icon from 'react-native-vector-icons/MaterialIcons';  // Assuming you are using this icon library

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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: theme.colors.onBackground, fontSize: 24, fontWeight: 'bold' }}>
          Items in {categoryName}
        </Text>
        
      </View>

      <ScrollView>
        {items.length > 0 ? (
          items.map((item, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => navigation.navigate('ItemDetail', { item, categoryName, bar })}  // Navigate to item detail
              style={{
                borderRadius: 10,
                marginVertical: 5,
                backgroundColor: theme.colors.surfaceVariant,
                shadowColor: theme.colors.shadow,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                elevation: 2,
                padding: 10,
                alignItems: 'center',
                flexDirection: 'row',
              }}
            >
              {/* Display item image */}
              <Image
                source={item.image ? { uri: item.image } : require('../assets/placeholder.jpg')}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 10,
                  backgroundColor: "white",
                }}
              />
              
              {/* Item name and other details */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>{item.name}</Text>
              </View>

              {/* Navigate Icon */}
              <Icon name="chevron-right" size={30} color={theme.colors.onSurface} />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={{ color: theme.colors.text, textAlign: 'center', marginTop: 20 }}>No items in this category.</Text>
        )}
      </ScrollView>
    </View>
  );
};

export default CategoryListScreen;
