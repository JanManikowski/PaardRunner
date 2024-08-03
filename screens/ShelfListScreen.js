// ShelfListScreen.js
import React, { useContext, useEffect, useState, useCallback } from 'react';
import { View, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData } from '../storage/AsyncStorageHelper';
import { Text, Icon } from 'react-native-elements';

const ShelfListScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barShelves } = useContext(FridgeContext);
  const [shelves, setShelves] = useState(barShelves[bar.name] || []);

  const fetchShelves = async () => {
    const updatedShelves = await Promise.all(
      shelves.map(async (shelf, index) => {
        const savedMissing = await getData(`shelf_${bar.name}_${index}`);
        return { ...shelf, missing: savedMissing !== null ? savedMissing : shelf.missing };
      })
    );
    setShelves(updatedShelves);
  };

  useFocusEffect(
    useCallback(() => {
      fetchShelves();
    }, [])
  );

  const getImageSource = (type) => {
    switch (type) {
      case '7up':
        return require('../assets/7up.jpeg');
      case 'Sisi':
        return require('../assets/sisi.jpg');
      case 'Tonic':
        return require('../assets/tonic.jpg');
      case 'Icetea Green':
        return require('../assets/icetea.jpeg');
      case 'Apple juice':
        return require('../assets/appelsap.jpeg');
      case 'Orange juice':
        return require('../assets/orange.png');
      case 'Cassis':
        return require('../assets/cassis.jpg');
      case 'Bitter lemon':
        return require('../assets/bitterlemon.jpeg');
      case 'White wine':
        return require('../assets/placeholder.jpg');
      case 'Rose':
        return require('../assets/placeholder.jpg');
      case 'Sweet wine':
        return require('../assets/placeholder.jpg');
      case 'Ginger beer':
        return require('../assets/placeholder.jpg');
      case 'Ginger ale':
        return require('../assets/placeholder.jpg');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <Text h4 style={{ marginBottom: 16, color: '#333' }}>Shelves in {bar.name}</Text>
      <ScrollView>
        {shelves.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate('ShelfDetail', { barName: bar.name, shelfIndex: index })}
            style={{
              borderRadius: 10,
              marginVertical: 5,
              backgroundColor: '#fff',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
              padding: 10,
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <Image source={getImageSource(item.type)} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: '#333' }}>{item.type}</Text>
              {item.missing > 0 && (
                <Text style={{ color: 'red', fontWeight: 'bold' }}>
                  {`${item.missing} missing`}
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={30} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ShelfListScreen;
