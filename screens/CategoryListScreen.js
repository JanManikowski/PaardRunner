import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const CategoryListScreen = ({ route, navigation }) => {
  const { categories, bar, categoryName } = route.params;
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
  const previousCategoryName =
    categories[(currentCategoryIndex - 1 + categories.length) % categories.length]?.name || 'No Category';
  const nextCategoryName =
    categories[(currentCategoryIndex + 1) % categories.length]?.name || 'No Category';

    const fetchItems = async () => {
      try {
        // Get the organization ID from the bar prop
        const orgId = bar.orgId;
        // Build the dynamic key for categories
        const categoriesKey = `categories_${orgId}`;
        // Retrieve stored categories for the active organization
        const storedCategories = JSON.parse(await AsyncStorage.getItem(categoriesKey)) || [];
        // Find the category matching the current category name
        const currentCategory = storedCategories.find(
          (category) => category.name === currentCategoryName
        );
    
        if (!currentCategory || !currentCategory.items) {
          setItems([]);
          return;
        }
    
        const itemsFromCategory = currentCategory.items;
    
        // Update each item with its corresponding "missing" value
        const updatedItems = await Promise.all(
          itemsFromCategory.map(async (item) => {
            const missingKey = `missing_${item.id}_${orgId}_${bar.name}`;
            const savedMissing = await AsyncStorage.getItem(missingKey);
            return {
              ...item,
              missing: savedMissing ? parseInt(savedMissing, 10) : 0,
            };
          })
        );
    
        setItems(updatedItems);
      } catch (error) {
        console.error('Error fetching items from AsyncStorage:', error);
      }
    };
    

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [currentCategoryName])
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
          <Icon name="arrow-back-ios" type="material" size={12} color={theme.colors.onPrimary} />
          <Text style={[styles.navButtonText, { color: theme.colors.onPrimary }]}>
            {previousCategoryName.slice(0, 10)}
            {previousCategoryName.length > 10 ? '...' : ''}
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
            {nextCategoryName.slice(0, 10)}
            {nextCategoryName.length > 10 ? '...' : ''}
          </Text>
          <Icon name="arrow-forward-ios" type="material" size={12} color={theme.colors.onPrimary} />
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
              justifyContent: 'space-between', // push name left, missing right
            }}
            onPress={() => navigation.navigate('ItemDetail', { items, itemIndex: index, bar })}
          >
            {/* Left side: Image + Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={
                  item.image ? { uri: item.image } : require('../assets/placeholder.jpg')
                }
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 10,
                  backgroundColor: 'white',
                }}
              />
              <Text style={{ fontWeight: 'bold', fontSize: 18, color: theme.colors.text }}>
                {item.name}
              </Text>
            </View>

            {/* Right side: Missing amount (if any) */}
            {item.missing > 0 && (
              <Text style={{ color: theme.colors.error, fontSize: 16, paddingRight: 10 }}>
                Missing: {item.missing}
              </Text>
            )}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 5,
    maxWidth: 120,
  },
  navButtonText: {
    fontSize: 14,
    marginHorizontal: 5,
    textAlign: 'center',
  },
  currentCategory: {
    flex: 2,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default CategoryListScreen;
