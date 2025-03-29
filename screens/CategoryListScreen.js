import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import { Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

const CategoryListScreen = ({ route, navigation }) => {
  const { categories, bar, categoryName } = route.params;
  const { theme } = useContext(ThemeContext);

  // Holds the items for the currently selected category
  const [items, setItems] = useState([]);

  // Start with null to indicate we haven’t decided which category index to show
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(null);

  /**
   * 1) Decide which category index we want to show, based on categoryName (if given).
   *    We do this in a plain useEffect so the order of hooks never changes.
   */
  useEffect(() => {
    if (categories?.length) {
      let index = -1;
      if (categoryName) {
        index = categories.findIndex(cat => cat.name === categoryName);
      }
      // If not found, default to the last category (or 0—your choice)
      if (index === -1) {
        index = categories.length - 1;
      }
      setCurrentCategoryIndex(index);
    } else {
      // If no categories, you could keep it at null or set to 0
      setCurrentCategoryIndex(null);
    }
  }, [categoryName, categories]);

  /**
   * 2) We define fetchItems at the top level. 
   *    If currentCategoryIndex is null, we simply do nothing in the function.
   */
  const fetchItems = useCallback(async () => {
    try {
      if (currentCategoryIndex === null) {
        // We haven't determined a category index yet, so skip
        return;
      }

      const currentCategoryName = categories[currentCategoryIndex]?.name;
      if (!currentCategoryName) {
        setItems([]);
        return;
      }

      const orgId = bar?.orgId;
      if (!orgId) {
        console.error('No orgId found in bar');
        setItems([]);
        return;
      }

      // Load from AsyncStorage
      const categoriesKey = `categories_${orgId}`;
      const storedCategories = JSON.parse(await AsyncStorage.getItem(categoriesKey)) || [];
      const currentCategory = storedCategories.find(
        category => category.name === currentCategoryName
      );

      if (!currentCategory || !currentCategory.items) {
        setItems([]);
        return;
      }

      // Load "missing" for each item
      const updatedItems = await Promise.all(
        currentCategory.items.map(async (item) => {
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
      console.error('Error fetching items:', error);
    }
  }, [bar, categories, currentCategoryIndex]);

  /**
   * 3) We always call useFocusEffect, unconditionally. 
   *    Inside it, we call fetchItems(). Because fetchItems() checks if currentCategoryIndex === null,
   *    we won’t break the rules of hooks.
   */
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  /**
   * 4) If we still haven’t determined the category index (null), show a loading or placeholder.
   *    Importantly, we do this AFTER all hooks are declared.
   */
  if (currentCategoryIndex === null) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.text }}>Loading category...</Text>
      </View>
    );
  }

  // Now we know currentCategoryIndex is a valid integer
  const currentCategoryName = categories[currentCategoryIndex]?.name || '';

  // For navigation buttons
  const previousCategoryName =
    categories[(currentCategoryIndex - 1 + categories.length) % categories.length]?.name || 'No Category';
  const nextCategoryName =
    categories[(currentCategoryIndex + 1) % categories.length]?.name || 'No Category';

  /**
   * 5) Category navigation: updates currentCategoryIndex so that
   *    fetchItems will run again via useFocusEffect.
   */
  const navigateToCategory = (direction) => {
    if (!categories?.length) return;
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
            key={item.id || index}
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
              justifyContent: 'space-between',
            }}
            onPress={() => navigation.navigate('ItemDetail', { items, itemIndex: index, bar })}
          >
            {/* Left side: Image + Name */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={item.image ? { uri: item.image } : require('../assets/placeholder.jpg')}
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

            {/* Right side: Missing amount */}
            {item.missing > 0 && (
              <Text style={{ color: theme.colors.error, fontSize: 16, paddingRight: 10 }}>
                Missing: {item.missing}
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {items.length === 0 && (
          <Text style={{ marginTop: 20, textAlign: 'center', color: theme.colors.text }}>
            No items in this category
          </Text>
        )}
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
