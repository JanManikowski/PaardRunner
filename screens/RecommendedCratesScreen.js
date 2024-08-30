import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FridgeContext } from '../contexts/FridgeContext';
import { ThemeContext } from '../contexts/ThemeContext';

const RecommendedCratesScreen = ({ route, navigation }) => {
  const { bar } = route.params || {};
  const { barFridges, barShelves } = useContext(FridgeContext);
  const { theme } = useContext(ThemeContext);
  const [recommendedCrates, setRecommendedCrates] = useState({ zwarte: [], gele: [] });

  useEffect(() => {
    if (!bar || !bar.name) {
      navigation.goBack(); // Navigate back if bar data is missing
      return;
    }

    const fetchItemsForCrates = async () => {
      let fridgeItems = [];
      let shelfItems = [];

      // Fetch missing fridge items for the current bar
      if (barFridges[bar.name]) {
        const fridges = await Promise.all(
          barFridges[bar.name].map(async (fridge, index) => {
            const savedMissing = await AsyncStorage.getItem(`fridge_${bar.name}_${index}`);
            return { ...fridge, missing: savedMissing !== null ? parseInt(savedMissing, 10) : fridge.missing };
          })
        );
        fridgeItems = fridges.filter(item => item.missing > 0);
      }

      // Fetch missing shelf items for the current bar
      if (barShelves[bar.name]) {
        const shelves = await Promise.all(
          barShelves[bar.name].map(async (shelf, index) => {
            const savedMissing = await AsyncStorage.getItem(`shelf_${bar.name}_${index}`);
            return { ...shelf, missing: savedMissing !== null ? parseInt(savedMissing, 10) : shelf.missing };
          })
        );
        shelfItems = shelves.filter(item => item.missing > 0);
      }

      // Create and sort crates for zwarte kratjes (fridge items)
      const zwarteCrates = createCrates(fridgeItems, 24);

      // Create and sort crates for gele kratjes (shelf items)
      const geleCrates = createCrates(shelfItems, 12);

      setRecommendedCrates({ zwarte: zwarteCrates, gele: geleCrates });
    };

    const createCrates = (items, maxItemsPerCrate) => {
      // Group items by type and calculate the total missing quantity and importance score
      const groupedItems = items.reduce((acc, item) => {
        const importanceScore = (item.missing / item.amount) * 100; // Calculate importance as missing percentage
        if (!acc[item.type]) {
          acc[item.type] = { quantity: 0, importance: importanceScore };
        }
        acc[item.type].quantity += item.missing;
        acc[item.type].importance = Math.max(acc[item.type].importance, importanceScore); // Use the highest importance score for the group
        return acc;
      }, {});

      // Convert the grouped items into an array of { type, quantity, importance }
      const itemArray = Object.keys(groupedItems).map(type => ({
        type,
        quantity: groupedItems[type].quantity,
        importance: groupedItems[type].importance.toFixed(2), // Round to two decimal places
      }));

      // Sort items by importance in descending order
      itemArray.sort((a, b) => b.importance - a.importance);

      // Create crates by filling each with the most important items until the crate is full
      const crates = [];
      let currentCrate = [];
      let currentItemsCount = 0;

      itemArray.forEach(item => {
        while (item.quantity > 0) {
          const remainingSpace = maxItemsPerCrate - currentItemsCount;
          const addQuantity = Math.min(item.quantity, remainingSpace);

          currentCrate.push({
            type: item.type,
            quantity: addQuantity,
            importance: item.importance
          });

          currentItemsCount += addQuantity;
          item.quantity -= addQuantity;

          if (currentItemsCount === maxItemsPerCrate) {
            crates.push([...currentCrate]); // Push a copy of the currentCrate array
            currentCrate = [];
            currentItemsCount = 0;
          }
        }
      });

      // If any items remain in the current crate, add it to the crates array
      if (currentCrate.length > 0) {
        crates.push([...currentCrate]); // Push the final crate
      }

      // Sort crates by the highest importance within the crate
      crates.sort((a, b) => {
        const maxImportanceA = Math.max(...a.map(i => parseFloat(i.importance)));
        const maxImportanceB = Math.max(...b.map(i => parseFloat(i.importance)));
        return maxImportanceB - maxImportanceA;
      });

      return crates;
    };

    fetchItemsForCrates();
  }, [bar, barFridges, barShelves, navigation]);

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {bar && bar.name ? (
        <>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            Recommended Crates for {bar.name}
          </Text>

          <View style={{background:theme.colors.surfaceVariant}}>
            <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>
              Zwarte Kratjes (Fridge Items)
            </Text>
            {recommendedCrates.zwarte.length > 0 ? (
              recommendedCrates.zwarte.map((crate, crateIndex) => (
                <View key={crateIndex} style={[styles.crateContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.crateTitle, { color: theme.colors.text }]}>
                    Crate {crateIndex + 1}
                  </Text>
                  {crate.map((item, index) => (
                    <View key={index} style={styles.itemContainer}>
                      <Text style={[styles.itemText, { color: theme.colors.text }]}>
                        {item.type.padEnd(20, ' ')} x{item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={[styles.noItemsText, { color: theme.colors.text }]}>
                No missing items for zwarte kratjes.
              </Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.colors.secondary }]}>
              Gele Kratjes (Shelf Items)
            </Text>
            {recommendedCrates.gele.length > 0 ? (
              recommendedCrates.gele.map((crate, crateIndex) => (
                <View key={crateIndex} style={[styles.crateContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.crateTitle, { color: theme.colors.text }]}>
                    Crate {crateIndex + 1}
                  </Text>
                  {crate.map((item, index) => (
                    <View key={index} style={styles.itemContainer}>
                      <Text style={[styles.itemText, { color: theme.colors.text }]}>
                        {item.type.padEnd(20, ' ')} x{item.quantity}
                      </Text>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={[styles.noItemsText, { color: theme.colors.text }]}>
                No missing items for gele kratjes.
              </Text>
            )}
          </View>
        </>
      ) : (
        <Text style={[styles.noBarText, { color: theme.colors.text }]}>
          No bar information available.
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
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  crateContainer: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  crateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemText: {
    fontSize: 16,
    fontFamily: 'monospace',
  },
  itemImportance: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  noItemsText: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  noBarText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default RecommendedCratesScreen;
