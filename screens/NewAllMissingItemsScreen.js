import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Button, 
  Alert 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const AllMissingItemsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  // Data structure: { barName: { categoryName: [item, ...], ... } }
  const [aggregatedData, setAggregatedData] = useState({});
  
  // For multi-select mode
  const [circleMode, setCircleMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);

  // Fetch all missing items for all bars of the active organization
  const fetchAllMissingItems = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        setAggregatedData({});
        return;
      }
      // Get all bars for the active organization
      const storedBars = await AsyncStorage.getItem(`bars_${activeOrgId}`);
      const bars = storedBars ? JSON.parse(storedBars) : [];
      // Get all global items
      const storedItems = await AsyncStorage.getItem('items');
      const items = storedItems ? JSON.parse(storedItems) : [];
      
      const aggregated = {};
      for (const bar of bars) {
        let barData = {};
        // Filter items for the org
        const orgItems = items.filter(item => item.orgId === activeOrgId);
        for (const item of orgItems) {
          const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
          const savedMissing = await AsyncStorage.getItem(missingKey);
          const missingAmount = savedMissing ? parseInt(savedMissing, 10) : 0;
          if (missingAmount > 0) {
            if (!barData[item.categoryName]) {
              barData[item.categoryName] = [];
            }
            barData[item.categoryName].push({
              ...item,
              missing: missingAmount,
              barName: bar.name,
            });
          }
        }
        // Only include bars that actually have missing items
        if (Object.keys(barData).length > 0) {
          aggregated[bar.name] = barData;
        }
      }
      setAggregatedData(aggregated);
    } catch (error) {
      console.error('Error fetching all missing items:', error);
    }
  };

  useEffect(() => {
    fetchAllMissingItems();
  }, []);

  // Handler to delete all missing items for a bar (long press on bar name)
  const handleDeleteBar = (barName) => {
    Alert.alert(
      'Delete All Missing Items',
      `Are you sure you want to delete all missing items for ${barName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = { ...aggregatedData };
              const categories = updated[barName];
              for (const category in categories) {
                for (const item of categories[category]) {
                  const key = `missing_${item.id}_${item.orgId}_${barName}`;
                  await AsyncStorage.removeItem(key);
                }
              }
              delete updated[barName];
              setAggregatedData(updated);
            } catch (err) {
              console.error('Error deleting all missing items for bar:', err);
            }
          },
        },
      ]
    );
  };

  // Multi-select mode functions
  const handleLongPressItem = () => {
    // Toggle selection mode. If turning off, clear checked items.
    setCircleMode(prev => {
      if (prev) setCheckedItems([]);
      return !prev;
    });
  };

  const handleToggleChecked = (barName, category, item) => {
    setCheckedItems(prev => {
      const existingIndex = prev.findIndex(
        c => c.barName === barName && c.category === category && c.itemId === item.id
      );
      if (existingIndex === -1) {
        return [...prev, { barName, category, orgId: item.orgId, itemId: item.id }];
      } else {
        const updated = [...prev];
        updated.splice(existingIndex, 1);
        return updated;
      }
    });
  };

  const isItemChecked = (barName, category, item) => {
    return checkedItems.some(
      c => c.barName === barName && c.category === category && c.itemId === item.id
    );
  };

  const deleteCheckedItems = async () => {
    Alert.alert(
      'Delete Selected Items',
      'Are you sure you want to delete all selected items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updated = { ...aggregatedData };
              for (const { barName, category, orgId, itemId } of checkedItems) {
                const key = `missing_${itemId}_${orgId}_${barName}`;
                await AsyncStorage.removeItem(key);
                if (updated[barName] && updated[barName][category]) {
                  const items = updated[barName][category];
                  const idx = items.findIndex(i => i.id === itemId);
                  if (idx !== -1) {
                    items.splice(idx, 1);
                    if (items.length === 0) delete updated[barName][category];
                  }
                  if (Object.keys(updated[barName]).length === 0) {
                    delete updated[barName];
                  }
                }
              }
              setAggregatedData(updated);
              setCheckedItems([]);
              setCircleMode(false);
            } catch (err) {
              console.error('Error deleting checked items:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={{ padding: 16, backgroundColor: theme.colors.background, flex: 1 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          textAlign: 'center',
          color: theme.colors.onBackground,
        }}
      >
        All Missing Items
      </Text>

      <ScrollView style={{ marginBottom: 20 }} contentContainerStyle={{ paddingBottom: 15 }}>
        {Object.keys(aggregatedData).length > 0 ? (
          Object.entries(aggregatedData).map(([barName, categories]) => (
            <View
              key={barName}
              style={{
                backgroundColor: theme.colors.surfaceVariant,
                padding: 15,
                borderRadius: 8,
                marginBottom: 20,
              }}
            >
              <TouchableOpacity onLongPress={() => handleDeleteBar(barName)}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    color: theme.colors.primary,
                  }}
                >
                  {barName}
                </Text>
              </TouchableOpacity>

              {Object.entries(categories).map(([category, items]) => (
                <View key={category} style={{ marginBottom: 20 }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: 'bold',
                      marginBottom: 10,
                      color: theme.colors.primary,
                    }}
                  >
                    {category}
                  </Text>
                  {items.map((item) => (
                    <View
                      key={item.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 10,
                      }}
                    >
                      {circleMode && (
                        <TouchableOpacity
                          onPress={() => handleToggleChecked(barName, category, item)}
                          style={{
                            marginRight: 10,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.colors.primary,
                            backgroundColor: isItemChecked(barName, category, item)
                              ? theme.colors.primary
                              : 'transparent',
                          }}
                        />
                      )}
                      <TouchableOpacity
                        onLongPress={handleLongPressItem}
                        style={{
                          flex: 2,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Image
                          source={{ uri: item.image || 'placeholder.jpg' }}
                          style={{
                            width: 40,
                            height: 40,
                            marginRight: 10,
                            borderRadius: 100,
                            backgroundColor: 'white',
                          }}
                        />
                        <Text style={{ fontSize: 16, color: theme.colors.text }}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: theme.colors.error }}>
                        Missing: {item.missing}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 18, textAlign: 'center', color: theme.colors.onSurface }}>
            All bars are looking good :)
          </Text>
        )}
      </ScrollView>

      {circleMode && (
        <View style={{ marginBottom: 10 }}>
          <Button title="Delete Selected Items" onPress={deleteCheckedItems} color="#FF3B30" />
        </View>
      )}

      <View style={{ marginBottom: 10 }}>
        <Button
          title="Share List"
          onPress={() => {
            // Implement share logic
          }}
          color="#4CAF50"
        />
      </View>
      <View style={{ marginBottom: 10 }}>
        <Button
          title="Delete All Items"
          onPress={() => {
            // Implement global delete-all logic if needed
          }}
          color="#FF3B30"
        />
      </View>
    </View>
  );
};

export default AllMissingItemsScreen;
