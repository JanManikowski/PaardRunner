import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FridgeContext } from '../contexts/FridgeContext';
import { ThemeContext } from '../contexts/ThemeContext';

const RecommendedCratesScreen = ({ route, navigation }) => {
  const { bar } = route.params || {};
  const { barFridges, barShelves } = useContext(FridgeContext);
  const { theme } = useContext(ThemeContext);
  const [recommendedCrates, setRecommendedCrates] = useState({ zwarte: [], gele: [] });
  const [crateSize, setCrateSize] = useState(24); // Default crate size is 24

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

      // Create and sort crates based on the current crate size
      const zwarteCrates = createCrates(fridgeItems, crateSize);
      const geleCrates = createCrates(shelfItems, crateSize);

      setRecommendedCrates({ zwarte: zwarteCrates, gele: geleCrates });
    };

    fetchItemsForCrates();
  }, [bar, barFridges, barShelves, crateSize, navigation]); // Recalculate when crateSize changes

  const createCrates = (items, maxItemsPerCrate) => {
    const groupedItems = items.reduce((acc, item) => {
      const importanceScore = (item.missing / item.amount) * 100; // Calculate importance as missing percentage
      if (!acc[item.type]) {
        acc[item.type] = { quantity: 0, importance: importanceScore };
      }
      acc[item.type].quantity += item.missing;
      acc[item.type].importance = Math.max(acc[item.type].importance, importanceScore); // Use the highest importance score for the group
      return acc;
    }, {});

    let itemArray = Object.keys(groupedItems).map(type => ({
      type,
      quantity: groupedItems[type].quantity,
      importance: groupedItems[type].importance,
    }));

    const crates = [];
    let currentCrate = {};
    let currentItemsCount = 0;

    while (itemArray.length > 0) {
      itemArray.sort((a, b) => b.importance - a.importance);

      const item = itemArray[0];
      const addQuantity = 1; // We now take 1 item at a time

      if (currentCrate[item.type]) {
        currentCrate[item.type].quantity += addQuantity;
      } else {
        currentCrate[item.type] = {
          type: item.type,
          quantity: addQuantity,
          importance: item.importance.toFixed(2)
        };
      }

      currentItemsCount += addQuantity;
      item.quantity -= addQuantity;

      if (currentItemsCount === maxItemsPerCrate) {
        crates.push(Object.values(currentCrate));
        currentCrate = {};
        currentItemsCount = 0;
      }

      if (item.quantity <= 0) {
        itemArray.shift();
      }

      item.importance = (item.quantity / groupedItems[item.type].quantity) * groupedItems[item.type].importance;
    }

    if (Object.keys(currentCrate).length > 0) {
      crates.push(Object.values(currentCrate)); // Push the final crate
    }

    crates.sort((a, b) => {
      const maxImportanceA = Math.max(...a.map(i => parseFloat(i.importance)));
      const maxImportanceB = Math.max(...b.map(i => parseFloat(i.importance)));
      return maxImportanceB - maxImportanceA;
    });

    return crates;
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {bar && bar.name ? (
        <>
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            Recommended Crates for {bar.name} ({crateSize} items per crate)
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => setCrateSize(crateSize === 24 ? 39 : 24)}
          >
            <Text style={styles.buttonText}>
              {crateSize === 24 ? 'Switch to 39-item Crates' : 'Switch to 24-item Crates'}
            </Text>
          </TouchableOpacity>

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
  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
    alignSelf: 'flex-end', // Aligns the button to the right
    marginBottom: 10, // Adds some space below the button
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12, // Smaller font size
    fontWeight: 'bold',
  },
});


export default RecommendedCratesScreen;