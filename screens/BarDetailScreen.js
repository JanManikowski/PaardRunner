// BarDetailScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import { FridgeContext } from '../contexts/FridgeContext';

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves } = useContext(FridgeContext);

  useEffect(() => {
    if (!barFridges[bar.name]) {
      const initialFridges = [
        { type: 'Spa Blauw', amount: 35, missing: 0 },
        { type: 'Grolsch 0.0', amount: 18, missing: 0 },
        { type: 'Grimbergen', amount: 18, missing: 0 },
        { type: 'Radler', amount: 12, missing: 0 },
        { type: 'Spa Rood', amount: 24, missing: 0 },
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

  console.log("BarDetailScreen rendered");
  console.log("Route params:", route.params);

  if (!bar) {
    console.error("No bar data found in route parameters");
    return null;
  }

  return (
    <View style={{ padding: 16, backgroundColor: '#F8F8F8', flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        {bar.name} Inventory
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('FridgeList', { bar })}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>View Fridges</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('ShelfList', { bar })}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>View Shelves</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('MissingItems', { bar })}
      >
        <Text style={{ fontSize: 18, fontWeight: '600' }}>View Missing Items</Text>
      </TouchableOpacity>
    </View>
  );
};

export default BarDetailScreen;
