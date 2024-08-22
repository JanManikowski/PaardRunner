import React, { useContext, useState, useCallback } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData } from '../storage/AsyncStorageHelper';
import { ListItem, Icon } from 'react-native-elements';

const FridgeListScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barFridges } = useContext(FridgeContext);
  const [fridges, setFridges] = useState(barFridges[bar.name] || []);

  const fetchFridges = async () => {
    const updatedFridges = await Promise.all(
      fridges.map(async (fridge, index) => {
        const savedMissing = await getData(`fridge_${bar.name}_${index}`);
        return { ...fridge, missing: savedMissing !== null ? savedMissing : fridge.missing };
      })
    );
    setFridges(updatedFridges);
  };

  useFocusEffect(
    useCallback(() => {
      fetchFridges();
    }, [])
  );

  const getImageSource = (type) => {
    switch (type) {
      case 'Spa Blauw':
        return require('../assets/fridge/spa_blauw.jpg');
      case 'Grolsch 0.0':
        return require('../assets/fridge/0.0.png');
      case 'Grimbergen':
        return require('../assets/fridge/grimbergen.jpg');
      case 'Radler':
        return require('../assets/fridge/radler.png');
      case 'Spa Rood':
        return require('../assets/fridge/sparood.jpg');
      case 'Weizen 0.0':
        return require('../assets/fridge/weizen.jpeg');
      case 'Bok':
        return require('../assets/fridge/bok.png');
      case 'IPA':
        return require('../assets/fridge/ipa.png');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <Text h4 style={{ marginBottom: 16, color: '#333' }}>Fridges in {bar.name}</Text>
      <ScrollView>
        {fridges.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate('FridgeDetail', { barName: bar.name, fridgeIndex: index })}
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

export default FridgeListScreen;
