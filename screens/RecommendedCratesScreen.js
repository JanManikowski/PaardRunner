import React, { useContext, useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert 
} from 'react-native';
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
        // Updated: fetch custom crates using the org-specific key
        const storedCrates = JSON.parse(await AsyncStorage.getItem(`customCrates_${bar.orgId}`)) || [];
        setCustomCrates(storedCrates);

        const missingItems = await fetchMissingItems(bar);
        const crates = generateRecommendedCrates(missingItems, storedCrates);
        setRecommendedCrates(crates);
      } catch (error) {
        console.error('Error fetching data for crates:', error);
      }
    };

    fetchData();
  }, [bar]);

  // Fetch missing items from local storage based on the current bar.
  const fetchMissingItems = async (bar) => {
    try {
      const categorizedItems = {};
      // Use the same key format as in other screens.
      const storedItems = JSON.parse(await AsyncStorage.getItem(`items_${bar.orgId}`)) || [];
      const filteredItems = storedItems.filter((item) => item.orgId === bar.orgId);
      
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
      return categorizedItems;
    } catch (error) {
      console.error('Error fetching missing items:', error);
      return {};
    }
  };

  // Generate recommended crates based on missing items and crate configurations.
  // We include each item's "id" so that we can delete its missing key later.
  const generateRecommendedCrates = (missingItems, crates) => {
    const recommended = [];
  
    crates.forEach((crate) => {
      const matchingItems = (missingItems[crate.category] || []).filter((item) => item.missing > 0);
  
      if (matchingItems.length > 0) {
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
              currentCrate = [];
              currentCrateCount = 0;
            }
  
            const itemsToFit = Math.min(remainingMissing, remainingSpace);
  
            if (itemsToFit > 0) {
              currentCrate.push({
                id: item.id,
                type: item.name,
                quantity: itemsToFit,
                image: item.image || null,
              });
  
              currentCrateCount += itemsToFit;
              remainingMissing -= itemsToFit;
            }
          }
  
          // Mark the item as processed.
          item.missing = 0;
        });
  
        if (currentCrate.length > 0) {
          recommended.push({
            crateName: `${crate.name} - Crate ${recommended.length + 1}`,
            category: crate.category,
            items: currentCrate.filter((i) => i.quantity > 0),
          });
        }
      }
    });
  
    return recommended;
  };

  // Long press handler for deleting the missing items within a recommended crate.
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
            // For each item in the crate, subtract the quantity from local storage
            for (const item of crate.items) {
              const key = `missing_${item.id}_${bar.orgId}_${bar.name}`;
              const storedValue = await AsyncStorage.getItem(key);
  
              if (storedValue) {
                const currentMissing = parseInt(storedValue, 10);
                const newMissing = currentMissing - item.quantity;
  
                if (newMissing <= 0) {
                  // If zero or negative, remove the entire item
                  await AsyncStorage.removeItem(key);
                } else {
                  // Otherwise, update with the reduced missing count
                  await AsyncStorage.setItem(key, newMissing.toString());
                }
              }
            }
  
            // Remove this crate from the recommendedCrates array
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
          // Calculate how many total items are in this crate
          const usedItemsCount = crate.items.reduce((sum, i) => sum + i.quantity, 0);
          // Retrieve crate.maxItems from your customCrates array, if it exists.
          const crateDefinition = customCrates.find(c => c.name === crate.crateName.split(' - ')[0]);
          const maxItems = crateDefinition ? crateDefinition.maxItems : 0;

          // Determine percentage used (capped at 100%)
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

              {/* Show how many items are used in this crate, plus a small usage bar */}
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
