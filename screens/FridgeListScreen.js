import React, { useContext, useState, useCallback } from 'react';
import { View, ScrollView, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData } from '../storage/AsyncStorageHelper';
import { ListItem } from 'react-native-elements';
import CustomText from '../components/CustomText'; // Assuming CustomText is in components folder

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
      case 'Spa blauw':
        return require('../assets/spa_blauw.jpg');
      case '0.0':
        return require('../assets/0.0.png');
      case 'Grimbergen':
        return require('../assets/grimbergen.jpg');
      case 'Radler':
        return require('../assets/radler.png');
      case 'Spa rood':
        return require('../assets/sparood.jpg');
      case 'Weizen 0.0':
        return require('../assets/weizen.jpeg');
      case 'Bok':
        return require('../assets/bok.png');
      case 'IPA':
        return require('../assets/ipa.png');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#f5f5f5' }}>
      <CustomText h4 style={{ marginBottom: 16, color: '#333' }}>Fridges in {bar.name}</CustomText>
      <ScrollView>
        {fridges.map((item, index) => (
          <ListItem
            key={index}
            bottomDivider
            onPress={() => navigation.navigate('FridgeDetail', { barName: bar.name, fridgeIndex: index })}
            containerStyle={{ borderRadius: 10, marginVertical: 5, backgroundColor: '#fff' }}
          >
            <Image source={getImageSource(item.type)} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }} />
            <ListItem.Content>
              <ListItem.Title style={{ fontWeight: 'bold', color: '#333' }}>{item.type}</ListItem.Title>
            </ListItem.Content>
            {item.missing > 0 && (
              <ListItem.Content right>
                <ListItem.Subtitle style={{ color: 'red', fontWeight: 'bold' }}>
                  {`${item.missing} missing`}
                </ListItem.Subtitle>
              </ListItem.Content>
            )}
          </ListItem>
        ))}
      </ScrollView>
    </View>
  );
};

export default FridgeListScreen;
