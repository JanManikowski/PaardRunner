import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { FridgeContext } from '../contexts/FridgeContext';

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves } = useContext(FridgeContext);

  useEffect(() => {
    if (!barFridges[bar.name]) {
      const initialFridges = [
        { type: 'Spa blauw', amount: 35, missing: 0 },
        { type: '0.0', amount: 18, missing: 0 },
        { type: 'Grimbergen', amount: 18, missing: 0 },
        { type: 'Radler', amount: 12, missing: 0 },
        { type: 'Spa rood', amount: 24, missing: 0 },
        { type: 'Weizen 0.0', amount: 12, missing: 0 },
        { type: 'Bok', amount: 6, missing: 0 },
        { type: 'IPA', amount: 12, missing: 0 },
      ];
      setBarFridges(prev => ({ ...prev, [bar.name]: initialFridges }));
    }
  }, [bar.name, barFridges, setBarFridges]);

  useEffect(() => {
    if (!barShelves[bar.name]) {
      const initialShelves = [
        { type: '7up', amount: 4, missing: 0 },
        { type: 'Sisi', amount: 4, missing: 0 },
        { type: 'Tonic', amount: 4, missing: 0 },
        { type: 'Sprite', amount: 4, missing: 0 },
        { type: 'Apple Juice', amount: 2, missing: 0 },
        { type: 'Orange Juice', amount: 2, missing: 0 },
        { type: 'Cassis', amount: 2, missing: 0 },
        { type: 'Bitter Lemon', amount: 2, missing: 0 },
        { type: 'White Wine', amount: 8, missing: 0 },
        { type: 'Rose', amount: 4, missing: 0 },
        { type: 'Sweet Wine', amount: 4, missing: 0 },
        { type: 'Ginger Beer', amount: 4, missing: 0 },
        { type: 'Ginger Ale', amount: 4, missing: 0 },
      ];
      setBarShelves(prev => ({ ...prev, [bar.name]: initialShelves }));
    }
  }, [bar.name, barShelves, setBarShelves]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{bar.name} Inventory</Text>
      <Button title="View Fridges" onPress={() => navigation.navigate('FridgeList', { bar })} />
      <Button title="View Shelves" onPress={() => navigation.navigate('ShelfList', { bar })} />
      <Button title="View Missing Items" onPress={() => navigation.navigate('MissingItems', { bar })} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    marginBottom: 10,
  },
});

export default BarDetailScreen;
