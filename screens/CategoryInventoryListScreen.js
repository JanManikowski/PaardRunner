import React, { useState, useContext, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity, Image, Text } from 'react-native';
import { Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ThemeContext } from '../contexts/ThemeContext';

const CategoryListScreen = ({ route, navigation }) => {
  const { categories, bar, categoryName } = route.params;
  const { theme } = useContext(ThemeContext);

  const [items, setItems] = useState([]);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(null);

  // decide initial category index
  useEffect(() => {
    if (categories?.length) {
      let idx = categoryName
        ? categories.findIndex(c => c.name === categoryName)
        : -1;
      if (idx === -1) idx = categories.length - 1;
      setCurrentCategoryIndex(idx);
    } else {
      setCurrentCategoryIndex(null);
    }
  }, [categories, categoryName]);

  // fetch items for the selected category
  const fetchItems = useCallback(async () => {
    if (currentCategoryIndex === null) return;

    const catName = categories[currentCategoryIndex]?.name;
    if (!catName || !bar?.orgId) {
      setItems([]);
      return;
    }

    try {
      const storedCats = JSON.parse(
        await AsyncStorage.getItem(`categories_${bar.orgId}`)
      ) || [];
      const cat = storedCats.find(c => c.name === catName);
      if (!cat?.items) {
        setItems([]);
        return;
      }

      const updated = await Promise.all(
        cat.items.map(async item => {
          const key = `missing_${item.id}_${bar.orgId}_${bar.name}`;
          const val = await AsyncStorage.getItem(key);
          return {
            ...item,
            missing: val ? parseInt(val, 10) : 0,
          };
        })
      );
      setItems(updated);
    } catch (e) {
      console.error('Error fetching items:', e);
      setItems([]);
    }
  }, [bar, categories, currentCategoryIndex]);

  // reload when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  // show loading until we know which category to load
  if (currentCategoryIndex === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colors.background,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.colors.text }}>Loading category...</Text>
      </View>
    );
  }

  const currName = categories[currentCategoryIndex]?.name || '';
  const prevName =
    categories[
      (currentCategoryIndex - 1 + categories.length) % categories.length
    ]?.name || '…';
  const nextName =
    categories[(currentCategoryIndex + 1) % categories.length]?.name || '…';

  const navigate = dir => {
    const len = categories.length;
    const nextIdx =
      dir === 'next'
        ? (currentCategoryIndex + 1) % len
        : (currentCategoryIndex - 1 + len) % len;
    setCurrentCategoryIndex(nextIdx);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      {/* header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          width: '100%',
        }}
      >
        <TouchableOpacity
          onPress={() => navigate('previous')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            borderRadius: 5,
            maxWidth: 120,
            backgroundColor: theme.colors.primary,
          }}
        >
          <Icon
            name="arrow-back-ios"
            type="material"
            size={12}
            color={theme.colors.onPrimary}
          />
          <Text
            style={{
              fontSize: 14,
              marginHorizontal: 5,
              textAlign: 'center',
              color: theme.colors.onPrimary,
            }}
          >
            {prevName.length > 10 ? prevName.slice(0, 10) + '…' : prevName}
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            flex: 2,
            fontSize: 20,
            fontWeight: 'bold',
            textAlign: 'center',
            color: theme.colors.text,
          }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {currName}
        </Text>

        <TouchableOpacity
          onPress={() => navigate('next')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            borderRadius: 5,
            maxWidth: 120,
            backgroundColor: theme.colors.primary,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              marginHorizontal: 5,
              textAlign: 'center',
              color: theme.colors.onPrimary,
            }}
          >
            {nextName.length > 10 ? nextName.slice(0, 10) + '…' : nextName}
          </Text>
          <Icon
            name="arrow-forward-ios"
            type="material"
            size={12}
            color={theme.colors.onPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* items */}
      <ScrollView removeClippedSubviews={true}>
        {items.map((item, idx) => (
          <TouchableOpacity
            key={item.id ?? idx}
            onPress={() =>
              navigation.navigate('ManageMissingAmount', {
                items,
                itemIndex: idx,
                bar,
              })
            }
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: theme.colors.surfaceVariant,
              padding: 10,
              borderRadius: 10,
              marginVertical: 5,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Image
                source={
                  item.image
                    ? { uri: item.image }
                    : require('../assets/placeholder.jpg')
                }
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  marginRight: 10,
                  backgroundColor: '#fff',
                }}
                resizeMode="cover"
                resizeMethod="resize"
              />
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  color: theme.colors.text,
                }}
              >
                {item.name}
              </Text>
            </View>
            {item.missing > 0 && (
              <Text
                style={{
                  fontSize: 16,
                  color: theme.colors.error,
                  paddingRight: 10,
                }}
              >
                Missing: {item.missing}
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {items.length === 0 && (
          <Text
            style={{
              marginTop: 20,
              textAlign: 'center',
              color: theme.colors.text,
            }}
          >
            No items in this category
          </Text>
        )}
      </ScrollView>
    </View>
  );
};

export default CategoryListScreen;
