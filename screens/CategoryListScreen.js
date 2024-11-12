import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const CategoryListScreen = ({ route, navigation }) => {
  const { categoryName, bar } = route.params;
  const { theme } = useContext(ThemeContext);
  const [items, setItems] = useState([]);

  // Fetch items for the selected category, including their missing amounts
  const fetchItems = async () => {
    const storedItems = JSON.parse(await AsyncStorage.getItem('items')) || [];
    const filteredItems = storedItems.filter(item => item.categoryName === categoryName && item.orgId === bar.orgId);

    // Fetch missing amounts for each item
    const updatedItems = await Promise.all(
      filteredItems.map(async (item) => {
        const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
        const savedMissing = await AsyncStorage.getItem(missingKey);
        return {
          ...item,
          missing: savedMissing ? parseInt(savedMissing, 10) : 0,
        };
      })
    );

    setItems(updatedItems);
    console.log('Items for category:', categoryName, updatedItems); // Log items for debugging
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [categoryName])
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.colors.text }}>
        Items in {categoryName}
      </Text>

      <ScrollView>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
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
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('ItemDetail', { items, itemIndex: index, bar })} // Navigate to ItemDetail
          >
            <Image
              source={item.image ? { uri: item.image } : require('../assets/placeholder.jpg')}
              style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>{item.name}</Text>
              {item.missing > 0 && (
                <Text style={{ color: 'red' }}>Missing Amount: {item.missing}</Text>
              )}
            </View>
            <Icon name="chevron-right" size={30} color={theme.colors.onSurface} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryListScreen;
