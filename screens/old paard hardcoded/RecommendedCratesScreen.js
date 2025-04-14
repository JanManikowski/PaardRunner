import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Button, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FridgeContext } from '../contexts/FridgeContext';
import { ThemeContext } from '../contexts/ThemeContext';
import { getData, saveData, removeData } from '../storage/AsyncStorageHelper';

const RecommendedCratesScreen = ({ route, navigation }) => {
  const { bar } = route.params || {};
  const { barFridges, setBarFridges, barShelves, setBarShelves, saveBarFridges, saveBarShelves, strongLiquor, addCustomMissingItem } = useContext(FridgeContext);
  const { theme } = useContext(ThemeContext);
  const [recommendedCrates, setRecommendedCrates] = useState({ zwarte: [], gele: [] });
  const [crateSize, setCrateSize] = useState(24);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;  // Flag to check if the component is still mounted
  
      const fetchItemsForCrates = async () => {
        try {
          let fridgeItems = [];
          let shelfItems = [];
  
          if (barFridges[bar.name]) {
            const fridges = await Promise.all(
              barFridges[bar.name].map(async (fridge, index) => {
                const savedMissing = await AsyncStorage.getItem(`fridge_${bar.name}_${index}`);
                return {
                  ...fridge,
                  missing: savedMissing !== null ? parseInt(savedMissing, 10) : fridge.missing,
                  fridgeIndex: index
                };
              })
            );
            fridgeItems = fridges.filter(item => item.missing > 0);
          }
  
          if (barShelves[bar.name]) {
            const shelves = await Promise.all(
              barShelves[bar.name].map(async (shelf, index) => {
                const savedMissing = await AsyncStorage.getItem(`shelf_${bar.name}_${index}`);
                return {
                  ...shelf,
                  missing: savedMissing !== null ? parseInt(savedMissing, 10) : shelf.missing,
                  shelfIndex: index
                };
              })
            );
            shelfItems = shelves.filter(item => item.missing > 0);
          }
  
          // Only update the state if the component is still mounted
          if (isMounted) {
            setRecommendedCrates({
              zwarte: createCrates(fridgeItems, crateSize),
              gele: createCrates(shelfItems, 12)
            });
          }
        } catch (error) {
          console.log('Error fetching crate items:', error);
        }
      };
  
      fetchItemsForCrates();
  
      // Cleanup function to handle component unmount
      return () => {
        isMounted = false; // Set the flag to false when the component unmounts
      };
    }, [barFridges, barShelves, bar.name, crateSize])
  );

  const createCrates = (items, maxItemsPerCrate) => {
    const groupedItems = items.reduce((acc, item) => {
      const importanceScore = (item.missing / item.amount) * 100;
      if (!acc[item.type]) {
        acc[item.type] = {
          quantity: 0,
          importance: importanceScore,
          fridgeIndex: item.fridgeIndex,
          shelfIndex: item.shelfIndex
        };
      }
      acc[item.type].quantity += item.missing;
      acc[item.type].importance = Math.max(acc[item.type].importance, importanceScore);
      return acc;
    }, {});

    let itemArray = Object.keys(groupedItems).map(type => ({
      type,
      quantity: groupedItems[type].quantity,
      importance: groupedItems[type].importance,
      fridgeIndex: groupedItems[type].fridgeIndex,
      shelfIndex: groupedItems[type].shelfIndex
    }));

    const crates = [];
    let currentCrate = {};
    let currentItemsCount = 0;

    while (itemArray.length > 0) {
      itemArray.sort((a, b) => b.importance - a.importance);

      const item = itemArray[0];
      const addQuantity = 1;

      if (currentCrate[item.type]) {
        currentCrate[item.type].quantity += addQuantity;
      } else {
        currentCrate[item.type] = {
          type: item.type,
          quantity: addQuantity,
          importance: item.importance.toFixed(2),
          fridgeIndex: item.fridgeIndex,
          shelfIndex: item.shelfIndex
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
      crates.push(Object.values(currentCrate));
    }

    crates.sort((a, b) => {
      const maxImportanceA = Math.max(...a.map(i => parseFloat(i.importance)));
      const maxImportanceB = Math.max(...b.map(i => parseFloat(i.importance)));
      return maxImportanceB - maxImportanceA;
    });

    return crates;
  };

  const deleteCrate = async (crateItems, crateType, crateIndex) => {
    Alert.alert(
      "Delete Crate",
      "Are you sure you want to delete all items in this crate?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              for (let item of crateItems) {
                let key, savedMissing, newMissing;
  
                if (crateType === 'zwarte') {
                  key = `fridge_${bar.name}_${item.fridgeIndex}`;
                } else if (crateType === 'gele') {
                  key = `shelf_${bar.name}_${item.shelfIndex}`;
                }
  
                if (key) {
                  savedMissing = await AsyncStorage.getItem(key);
                  if (savedMissing !== null) {
                    savedMissing = parseInt(savedMissing, 10);
                    newMissing = savedMissing - item.quantity;
  
                    if (newMissing > 0) {
                      await AsyncStorage.setItem(key, newMissing.toString());
                    } else {
                      await removeData(key);
                    }
                  }
                }
              }
  
              const updatedCrates = recommendedCrates[crateType].filter((_, index) => index !== crateIndex);
              setRecommendedCrates(prev => ({ ...prev, [crateType]: updatedCrates }));
  
              if (crateType === 'zwarte') {
                saveBarFridges(updatedCrates);
              } else if (crateType === 'gele') {
                saveBarShelves(updatedCrates);
              }
            } catch (error) {
              console.log('Error deleting crate:', error);
            }
          },
          style: "destructive"
        }
      ]
    );
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
  
          <View style={{ background: theme.colors.surfaceVariant }}>
            <Text style={[styles.sectionHeader, { color: theme.colors.primary }]}>
              Zwarte Kratjes (Fridge Items)
            </Text>
            {recommendedCrates.zwarte.length > 0 ? (
              recommendedCrates.zwarte.map((crate, crateIndex) => (
                <TouchableOpacity
                  key={crateIndex}
                  onLongPress={() => {
                    console.log(`Deleting crate of type: zwarte, at index: ${crateIndex}`);
                    console.log('Crate contents:', crate);
                    deleteCrate(crate, 'zwarte', crateIndex);
                  }}
                  style={[styles.crateContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}
                >
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
                </TouchableOpacity>
              ))
            ) : (
              <Text>No missing items for zwarte kratjes.</Text>
            )}
          </View>
  
          <View style={styles.section}>
            <Text style={[styles.sectionHeader, { color: theme.colors.secondary }]}>
              Gele Kratjes (Shelf Items)
            </Text>
            {recommendedCrates.gele.length > 0 ? (
              recommendedCrates.gele.map((crate, crateIndex) => (
                <TouchableOpacity
                  key={crateIndex}
                  onLongPress={() => deleteCrate(crate, 'gele', crateIndex)}
                  style={[styles.crateContainer, { borderColor: theme.colors.border, backgroundColor: theme.colors.surfaceVariant }]}
                >
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
                </TouchableOpacity>
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
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default RecommendedCratesScreen;
