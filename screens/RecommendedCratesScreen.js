import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const RecommendedCratesScreen = ({ route }) => {
  const { bar } = route.params || {};
  const { theme } = useContext(ThemeContext);
  const [recommendedCrates, setRecommendedCrates] = useState([]);
  const [customCrates, setCustomCrates] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedCrates = JSON.parse(await AsyncStorage.getItem('customCrates')) || [];
        console.log('Custom Crates:', storedCrates);
        setCustomCrates(storedCrates);

        const missingItems = await fetchMissingItems(bar);
        console.log('Fetched Missing Items:', missingItems);

        const crates = generateRecommendedCrates(missingItems, storedCrates);
        console.log('Generated Recommended Crates:', crates);
        setRecommendedCrates(crates);
      } catch (error) {
        console.error('Error fetching data for crates:', error);
      }
    };

    fetchData();
  }, [bar]);

  const fetchMissingItems = async () => {
    try {
      const categorizedItems = {};
      const storedItems = JSON.parse(await AsyncStorage.getItem('items')) || [];
      console.log('Stored Items:', storedItems);

      const filteredItems = storedItems.filter((item) => item.orgId === bar.orgId);
      console.log('Filtered Items:', filteredItems);

      for (const item of filteredItems) {
        const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
        const savedMissing = await AsyncStorage.getItem(missingKey);
        const missingAmount = savedMissing ? parseInt(savedMissing, 10) : 0;

        if (missingAmount > 0) {
          if (!categorizedItems[item.categoryName]) {
            categorizedItems[item.categoryName] = [];
          }
          categorizedItems[item.categoryName].push({ ...item, missing: missingAmount });
        }
      }

      console.log('Categorized Items:', categorizedItems);
      return categorizedItems;
    } catch (error) {
      console.error('Error fetching missing items:', error);
      return {};
    }
  };

  const generateRecommendedCrates = (missingItems, crates) => {
    const recommended = [];
  
    crates.forEach((crate) => {
      const matchingItems = (missingItems[crate.category] || []).filter((item) => item.missing > 0);
  
      if (matchingItems.length > 0) {
        console.log(`Generating crates for category: ${crate.category}`, matchingItems);
  
        matchingItems.sort((a, b) => b.missing - a.missing);
  
        let currentCrate = [];
        let currentCrateCount = 0;
  
        matchingItems.forEach((item) => {
          let remainingMissing = item.missing;
  
          while (remainingMissing > 0) {
            const remainingSpace = crate.maxItems - currentCrateCount;
  
            if (remainingSpace <= 0) {
              recommended.push({
                crateName: `${crate.name} - Crate ${recommended.length + 1}`,
                category: crate.category,
                items: currentCrate.filter((i) => i.quantity > 0),
              });
              console.log('Generated Crate:', currentCrate);
              currentCrate = [];
              currentCrateCount = 0;
            }
  
            const itemsToFit = Math.min(remainingMissing, remainingSpace);
  
            if (itemsToFit > 0) {
              currentCrate.push({
                type: item.name,
                quantity: itemsToFit,
                importance: ((itemsToFit / crate.maxItems) * 100).toFixed(2),
              });
  
              currentCrateCount += itemsToFit;
              remainingMissing -= itemsToFit;
            }
          }
  
          item.missing = 0; // Set missing to 0 after it's fully distributed
        });
  
        if (currentCrate.length > 0) {
          recommended.push({
            crateName: `${crate.name} - Crate ${recommended.length + 1}`,
            category: crate.category,
            items: currentCrate.filter((i) => i.quantity > 0),
          });
          console.log('Final Generated Crate:', currentCrate);
        }
      }
    });
  
    console.log('Final Recommended Crates:', recommended);
    return recommended;
  };

  
  
    return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={[styles.headerText, { color: theme.colors.text }]}>
        Recommended Crates for {bar.name}
      </Text>

      {recommendedCrates.length > 0 ? (
        recommendedCrates.map((crate, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.crateContainer, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Text style={[styles.crateTitle, { color: theme.colors.text }]}>
              {crate.crateName} ({crate.category})
            </Text>
            {crate.items.map((item, itemIndex) => (
              <Text key={itemIndex} style={[styles.itemText, { color: theme.colors.text }]}>
                {item.type} x{item.quantity} (Importance: {item.importance}%)
              </Text>
            ))}
          </TouchableOpacity>
        ))
      ) : (
        <Text style={[styles.noItemsText, { color: theme.colors.text }]}>
          No recommended crates available.
        </Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  crateContainer: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  crateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemText: {
    fontSize: 16,
  },
  noItemsText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default RecommendedCratesScreen;
