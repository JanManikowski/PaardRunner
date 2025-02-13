import React, { useEffect, useState, useContext } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const AllMissingItemsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [aggregatedData, setAggregatedData] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchAllMissingItems = async () => {
    setLoading(true);
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        setAggregatedData({});
        setLoading(false);
        return;
      }
      // Retrieve all bars for the active organization
      const storedBars = await AsyncStorage.getItem(`bars_${activeOrgId}`);
      const bars = storedBars ? JSON.parse(storedBars) : [];
      // Retrieve global items
      const storedItems = await AsyncStorage.getItem('items');
      const items = storedItems ? JSON.parse(storedItems) : [];
      
      // We'll aggregate data in this structure:
      // { barName: { categoryName: [item, item, ...], ... }, ... }
      const aggregated = {};

      for (const bar of bars) {
        aggregated[bar.name] = {};
        // Filter items for this organization (they’re global) and then for each, check the missing value for this bar.
        const orgItems = items.filter(item => item.orgId === activeOrgId);
        for (const item of orgItems) {
          const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
          const savedMissing = await AsyncStorage.getItem(missingKey);
          const missingAmount = savedMissing ? parseInt(savedMissing, 10) : 0;
          if (missingAmount > 0) {
            if (!aggregated[bar.name][item.categoryName]) {
              aggregated[bar.name][item.categoryName] = [];
            }
            aggregated[bar.name][item.categoryName].push({
              ...item,
              missing: missingAmount,
            });
          }
        }
      }
      setAggregatedData(aggregated);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllMissingItems();
  }, []);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {Object.keys(aggregatedData).length > 0 ? (
        Object.entries(aggregatedData).map(([barName, categories]) => (
          <View key={barName} style={styles.barSection}>
            <Text style={[styles.barTitle, { color: theme.colors.primary }]}>{barName}</Text>
            {Object.entries(categories).map(([category, items]) => (
              <View key={category} style={styles.categorySection}>
                <Text style={[styles.categoryTitle, { color: theme.colors.text }]}>{category}</Text>
                {items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={[styles.itemName, { color: theme.colors.text }]}>{item.name}</Text>
                    <Text style={[styles.itemMissing, { color: theme.colors.error }]}>
                      Missing: {item.missing}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))
      ) : (
        <Text style={[styles.noDataText, { color: theme.colors.text }]}>
          No missing items found.
        </Text>
      )}

      {/* Button at the bottom to refresh the missing items list */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
        onPress={fetchAllMissingItems}
      >
        <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Refresh Missing Items</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  barSection: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  barTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  categorySection: {
    marginLeft: 10,
    marginBottom: 10,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemName: {
    fontSize: 16,
  },
  itemMissing: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    marginVertical: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AllMissingItemsScreen;
