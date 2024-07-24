import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MissingItemsScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const [fridges, setFridges] = useState([]);
  const [shelves, setShelves] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    try {
      const storedFridges = await AsyncStorage.getItem(`fridges_${bar.name}`);
      const storedShelves = await AsyncStorage.getItem(`shelves_${bar.name}`);

      if (storedFridges) setFridges(JSON.parse(storedFridges));
      if (storedShelves) setShelves(JSON.parse(storedShelves));

      setLoading(false);
    } catch (error) {
      console.error('Failed to load inventory from storage', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const getTotalMissingItems = () => {
    const fridgeItems = fridges.filter(item => item.missing > 0);
    const shelfItems = shelves.filter(item => item.missing > 0);
    return [...fridgeItems, ...shelfItems];
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Missing Items</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        getTotalMissingItems().map((item, index) => (
          <View key={index} style={styles.itemContainer}>
            <Text style={styles.itemType}>{item.type}</Text>
            <Text style={styles.itemMissing}>{`${item.missing} missing`}</Text>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemType: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemMissing: {
    fontSize: 18,
    color: 'red',
  },
});

export default MissingItemsScreen;
