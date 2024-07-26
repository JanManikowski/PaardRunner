import React, { useState, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { Button, Text } from 'react-native-elements';
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

  return (
    <View style={{ padding: 16, backgroundColor: '#F8F8F8', flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        {bar.name} Inventory
      </Text>
      <Button
        title="View Fridges"
        buttonStyle={{
          padding: 15,
          marginVertical: 10,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          backgroundColor: '#007BFF', // Primary color
        }}
        titleStyle={{ fontSize: 16 }}
        containerStyle={{ marginBottom: 10 }}
        onPress={() => navigation.navigate('FridgeList', { bar })}
      />
      <Button
        title="View Shelves"
        buttonStyle={{
          padding: 15,
          marginVertical: 10,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          backgroundColor: '#007BFF', // Primary color
        }}
        titleStyle={{ fontSize: 16 }}
        containerStyle={{ marginBottom: 10 }}
        onPress={() => navigation.navigate('ShelfList', { bar })}
      />
      <Button
        title="View Missing Items"
        buttonStyle={{
          padding: 15,
          marginVertical: 10,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          backgroundColor: '#F44336', // Accent color
        }}
        titleStyle={{ fontSize: 16 }}
        containerStyle={{ marginBottom: 10 }}
        onPress={() => navigation.navigate('MissingItems', { bar })}
      />
    </View>
  );
};

export default BarDetailScreen;
