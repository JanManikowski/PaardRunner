import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const CategoryListScreen = ({ route, navigation }) => {
  const { categories, bar, categoryName } = route.params; // Receive `categories` and `bar` via route.params
  const { theme } = useContext(ThemeContext);
  const [items, setItems] = useState([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);

  useEffect(() => {
    if (categoryName && categories?.length) {
      const index = categories.findIndex((cat) => cat.name === categoryName);
      if (index !== -1) {
        setCurrentCategoryIndex(index);
      }
    }
  }, [categoryName, categories]);

  const currentCategoryName = categories[currentCategoryIndex]?.name;

  // Calculate the previous and next category names
  const previousCategoryName = categories[(currentCategoryIndex - 1 + categories.length) % categories.length]?.name || 'No Category';
  const nextCategoryName = categories[(currentCategoryIndex + 1) % categories.length]?.name || 'No Category';

  // Fetch items for the selected category
  const fetchItems = async () => {
    const storedItems = JSON.parse(await AsyncStorage.getItem('items')) || [];
    const filteredItems = storedItems.filter(
      (item) => item.categoryName === currentCategoryName && item.orgId === bar.orgId
    );

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
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [currentCategoryName]) // Re-fetch items when category changes
  );

  const navigateToCategory = (direction) => {
    const newIndex =
      direction === 'next'
        ? (currentCategoryIndex + 1) % categories.length
        : (currentCategoryIndex - 1 + categories.length) % categories.length;
    setCurrentCategoryIndex(newIndex);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {/* Header with navigation buttons */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigateToCategory('previous')}
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.onPrimary }]}>
            {`< ${previousCategoryName.slice(0, 10)}${previousCategoryName.length > 10 ? '...' : ''}`}
          </Text>
        </TouchableOpacity>

        <Text
          style={[styles.currentCategory, { color: theme.colors.text }]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {currentCategoryName}
        </Text>

        <TouchableOpacity
          onPress={() => navigateToCategory('next')}
          style={[styles.navButton, { backgroundColor: theme.colors.primary }]}
        >
          <Text style={[styles.navButtonText, { color: theme.colors.onPrimary }]}>
            {`${nextCategoryName.slice(0, 10)}${nextCategoryName.length > 10 ? '...' : ''} >`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Items List */}
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
              style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, backgroundColor: 'white' }}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>{item.name}</Text>
              {item.missing > 0 && (
                <Text style={{ color: theme.colors.error }}>Missing Amount: {item.missing}</Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    width: '100%',
  },
  navButton: {
    flex: 1, // Ensure equal spacing for navigation buttons
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 120,
  },
  navButtonText: {
    fontSize: 14,
    textAlign: 'center',
  },
  currentCategory: {
    flex: 2, // Allow the current category name to take up more space
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CategoryListScreen;
