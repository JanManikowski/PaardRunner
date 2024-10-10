// AllMissingItemsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, ScrollView, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const AllMissingItemsScreen = () => {
  const [missingItems, setMissingItems] = useState([]);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchAllMissingItems = async () => {
      const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      const allMissingItems = [];

      for (let bar of storedBars) {
        const fridgeItems = await getBarItems(`fridge_${bar.name}`);
        const shelfItems = await getBarItems(`shelf_${bar.name}`);
        const customItems = await getBarItems(`custom_${bar.name}`);
        const liquorItems = await getLiquorItems();

        allMissingItems.push({
          barName: bar.name,
          fridgeItems,
          shelfItems,
          customItems,
          liquorItems,
        });
      }

      setMissingItems(allMissingItems);
    };

    fetchAllMissingItems();
  }, []);

  const getBarItems = async (keyPrefix) => {
    const items = JSON.parse(await AsyncStorage.getItem(keyPrefix)) || [];
    return items.filter(item => item.missing > 0);
  };

  const getLiquorItems = async () => {
    const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
    const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
    return Object.keys(liquorCounts)
      .filter(type => liquorCounts[type] > 0)
      .map(type => ({ type, missing: liquorCounts[type] }));
  };

  return (
    <ScrollView style={{ padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        All Missing Items
      </Text>

      {missingItems.map((bar, index) => (
        <View key={index} style={{ marginBottom: 20, backgroundColor: theme.colors.surface, padding: 10, borderRadius: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.primary }}>{bar.barName}</Text>
          
          {bar.fridgeItems.length > 0 && (
            <View>
              <Text style={{ fontSize: 18, color: theme.colors.secondary }}>Fridge Items:</Text>
              {bar.fridgeItems.map((item, idx) => (
                <Text key={idx} style={{ color: theme.colors.text }}>
                  - {item.type}: {item.missing}
                </Text>
              ))}
            </View>
          )}

          {bar.shelfItems.length > 0 && (
            <View>
              <Text style={{ fontSize: 18, color: theme.colors.secondary }}>Shelf Items:</Text>
              {bar.shelfItems.map((item, idx) => (
                <Text key={idx} style={{ color: theme.colors.text }}>
                  - {item.type}: {item.missing}
                </Text>
              ))}
            </View>
          )}

          {bar.liquorItems.length > 0 && (
            <View>
              <Text style={{ fontSize: 18, color: theme.colors.error }}>Liquor Items:</Text>
              {bar.liquorItems.map((item, idx) => (
                <Text key={idx} style={{ color: theme.colors.text }}>
                  - {item.type}: {item.missing}
                </Text>
              ))}
            </View>
          )}

          {bar.customItems.length > 0 && (
            <View>
              <Text style={{ fontSize: 18, color: theme.colors.tertiary }}>Custom Items:</Text>
              {bar.customItems.map((item, idx) => (
                <Text key={idx} style={{ color: theme.colors.text }}>
                  - {item.type}: {item.missing}
                </Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
};

export default AllMissingItemsScreen;
