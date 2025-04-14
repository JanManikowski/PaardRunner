import React, { useContext, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
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
        // Retrieve custom crate configurations (each includes category and maxItems)
        const storedCrates = JSON.parse(await AsyncStorage.getItem(`customCrates_${bar.orgId}`)) || [];
        setCustomCrates(storedCrates);

        // Get the missing items per category from local storage.
        const missingItems = await fetchMissingItems(bar);
        // Generate recommended crates using the new dynamic priority algorithm.
        const crates = generateRecommendedCrates(missingItems, storedCrates);
        setRecommendedCrates(crates);
      } catch (error) {
        console.error('Error fetching data for crates:', error);
      }
    };

    fetchData();
  }, [bar]);

  // Retrieves missing item counts per category.
  // Each item is expected to have a defined maximum (item.maxAmount).
  const fetchMissingItems = async (bar) => {
    const categorizedItems = {};
    const categoriesKey = `categories_${bar.orgId}`;
    const storedCategories = JSON.parse(await AsyncStorage.getItem(categoriesKey)) || [];

    for (const category of storedCategories) {
      for (const item of category.items || []) {
        const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
        const savedMissing = await AsyncStorage.getItem(missingKey);
        const missingAmount = savedMissing ? parseInt(savedMissing, 10) : 0;

        if (missingAmount > 0) {
          if (!categorizedItems[category.name]) {
            categorizedItems[category.name] = [];
          }
          // Copy the item and attach its missing count.
          categorizedItems[category.name].push({
            ...item,
            missing: missingAmount,
          });
        }
      }
    }
    return categorizedItems;
  };

  // Generate recommended crates using a dynamic, unit-by-unit algorithm.
  // For each custom crate configuration, items are added one-by-one.
  // In each round we calculate priority (missing / maxAmount), choose the candidate
  // with the highest priority (and with least allocated units in the current crate on tie),
  // then update its missing count before proceeding.
  const generateRecommendedCrates = (missingItems, crateConfigs) => {
    const recommended = [];

    // Iterate through each custom crate configuration
    crateConfigs.forEach((crateConfig) => {
      // Get a shallow copy of all items in the category so we can update their missing counts
      const itemsForCategory = missingItems[crateConfig.category]
        ? missingItems[crateConfig.category].map(item => ({ ...item }))
        : [];
      if (itemsForCategory.length === 0) return;

      // Continue generating new crates until there are no more missing items for this category.
      while (itemsForCategory.some(item => item.missing > 0)) {
        let currentCrate = [];
        let currentCrateCount = 0;

        // Fill the current crate one unit at a time.
        while (
          currentCrateCount < crateConfig.maxItems &&
          itemsForCategory.some(item => item.missing > 0)
        ) {
          // Get only items that still need units.
          const candidates = itemsForCategory.filter(item => item.missing > 0);

          // Calculate the priority for each candidate.
          candidates.forEach(item => {
            item.priority = item.missing / item.maxAmount;
          });

          // Determine the maximum priority value among candidates.
          const maxPriority = Math.max(...candidates.map(item => item.priority));
          // Filter the candidates to those that have this maximum priority.
          let topCandidates = candidates.filter(item => item.priority === maxPriority);

          // Tie-breaker: choose the candidate with the fewest units already allocated in this crate.
          topCandidates.sort((a, b) => {
            const qtyA = currentCrate.find(i => i.id === a.id)?.quantity || 0;
            const qtyB = currentCrate.find(i => i.id === b.id)?.quantity || 0;
            return qtyA - qtyB;
          });

          const chosenItem = topCandidates[0];

          // Add one unit of the chosen item to the current crate.
          const crateItemIndex = currentCrate.findIndex(i => i.id === chosenItem.id);
          if (crateItemIndex >= 0) {
            currentCrate[crateItemIndex].quantity += 1;
          } else {
            currentCrate.push({
              id: chosenItem.id,
              type: chosenItem.name,
              quantity: 1,
              image: chosenItem.image || null,
            });
          }

          // Subtract the added unit from the chosen item's missing count.
          chosenItem.missing -= 1;
          currentCrateCount += 1;
        }

        // Once the crate is filled or no more units can be allocated, add it to the recommended list.
        if (currentCrate.length > 0) {
          recommended.push({
            crateName: `${crateConfig.name} - Crate ${recommended.length + 1}`,
            category: crateConfig.category,
            items: currentCrate.filter(i => i.quantity > 0),
          });
        }
      }
    });
    return recommended;
  };

  // Handler to delete the items in a recommended crate.
  // For each item, we subtract the quantity from its missing count in AsyncStorage.
  const handleDeleteCrateItems = (crate) => {
    Alert.alert(
      "Delete Crate Items",
      `Are you sure you want to remove the crate items for ${crate.crateName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            for (const item of crate.items) {
              const key = `missing_${item.id}_${bar.orgId}_${bar.name}`;
              const storedValue = await AsyncStorage.getItem(key);

              if (storedValue) {
                const currentMissing = parseInt(storedValue, 10);
                const newMissing = currentMissing - item.quantity;

                if (newMissing <= 0) {
                  await AsyncStorage.removeItem(key);
                } else {
                  await AsyncStorage.setItem(key, newMissing.toString());
                }
              }
            }

            // Remove this crate from the list
            setRecommendedCrates((prev) =>
              prev.filter((r) => r.crateName !== crate.crateName)
            );

            Alert.alert("Success", "Crate items have been removed.");
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 24,
          color: theme.colors.text,
        }}
      >
        Recommended Crates for {bar.name}
      </Text>

      {recommendedCrates.length > 0 ? (
        recommendedCrates.map((crate, index) => {
          // Calculate total units used in the crate.
          const usedItemsCount = crate.items.reduce((sum, i) => sum + i.quantity, 0);
          // Look up the defined crate capacity from customCrates.
          const crateDefinition = customCrates.find(c => c.name === crate.crateName.split(' - ')[0]);
          const maxItems = crateDefinition ? crateDefinition.maxItems : 0;
          const usedPercent = maxItems > 0 ? Math.min(100, (usedItemsCount / maxItems) * 100) : 0;

          return (
            <TouchableOpacity
              key={index}
              style={{
                borderRadius: 10,
                padding: 16,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              onLongPress={() => handleDeleteCrateItems(crate)}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 4,
                  color: theme.colors.text,
                }}
              >
                {crate.crateName}{' '}
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: 'normal',
                    color: theme.colors.text,
                  }}
                >
                  ({crate.category})
                </Text>
              </Text>

              {maxItems > 0 && (
                <>
                  <Text
                    style={{
                      fontSize: 14,
                      color: '#999',
                      marginBottom: 6,
                    }}
                  >
                    {usedItemsCount}/{maxItems} Items Used
                  </Text>
                  <View
                    style={{
                      height: 10,
                      width: '100%',
                      backgroundColor: '#ccc',
                      borderRadius: 5,
                      overflow: 'hidden',
                      marginBottom: 8,
                    }}
                  >
                    <View
                      style={{
                        height: '100%',
                        width: `${usedPercent}%`,
                        backgroundColor: theme.colors.primary,
                      }}
                    />
                  </View>
                </>
              )}

              <View
                style={{
                  height: 1,
                  backgroundColor: '#ccc',
                  marginVertical: 6,
                }}
              />

              {crate.items.map((item, itemIndex) => (
                <View
                  key={itemIndex}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}
                >
                  {item.image ? (
                    <Image
                      source={{ uri: item.image }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 10,
                        backgroundColor: '#fff',
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 10,
                        backgroundColor: '#ccc',
                      }}
                    />
                  )}
                  <Text
                    style={{
                      fontSize: 16,
                      flexShrink: 1,
                      color: theme.colors.text,
                    }}
                  >
                    {item.type} x{item.quantity}
                  </Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })
      ) : (
        <Text
          style={{
            fontSize: 18,
            fontStyle: 'italic',
            textAlign: 'center',
            marginTop: 20,
            color: theme.colors.text,
          }}
        >
          No recommended crates available.
        </Text>
      )}
    </ScrollView>
  );
};

export default RecommendedCratesScreen;
