import React, { useContext, useState, useCallback, useLayoutEffect } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { Text, Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';
import { getData } from '../storage/AsyncStorageHelper';

const ShelfListScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barShelves } = useContext(FridgeContext);
  const { theme } = useContext(ThemeContext);
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
        return require('../assets/shelve/7up.jpeg');
      case 'Sisi':
        return require('../assets/shelve/sisi.jpg');
      case 'Icetea Green':
        return require('../assets/shelve/icetea.jpeg');
      case 'Tonic':
        return require('../assets/shelve/tonic.jpg');
      case 'Apple Juice':
        return require('../assets/shelve/appelsap.jpeg');
      case 'Orange Juice':
        return require('../assets/shelve/orange.png');
      case 'Cassis':
        return require('../assets/shelve/cassis.jpg');
      case 'Bitter Lemon':
        return require('../assets/shelve/bitterlemon.jpeg');
      case 'White Wine':
        return require('../assets/shelve/whitewine.png');
      case 'Rose':
        return require('../assets/shelve/rose.jpg');
      case 'Sweet Wine':
        return require('../assets/shelve/sweetwine.jpeg');
      case 'Ginger Beer':
        return require('../assets/shelve/gingerbeer.jpeg');
      case 'Ginger Ale':
        return require('../assets/shelve/gingerale.jpeg');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('BarDetail', { bar })}
          style={{ marginLeft: 10 }}
        >
          <Icon name="arrow-back" size={25} color={theme.colors.onSurface} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, bar, theme.colors.onSurface]);

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: theme.colors.onBackground, fontSize: 24, fontWeight: 'bold' }}>
          Shelves in {bar.name}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.reset({
            index: 1,
            routes: [
              { name: 'BarDetail', params: { bar: { name: bar.name } } },
              { name: 'FridgeList', params: { bar: { name: bar.name } } },
            ],
          })}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 15,
            borderRadius: 10,
          }}
        >
          <Icon name="list" color={theme.colors.onPrimary} style={{ marginRight: 5 }} />
          <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>Go to Fridges</Text>
        </TouchableOpacity>
      </View>

      <ScrollView>
        {shelves.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate('ShelfDetail', { barName: bar.name, shelfIndex: index })}
            style={{
              borderRadius: 10,
              marginVertical: 5,
              backgroundColor: theme.colors.surfaceVariant,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
              padding: 10,
              alignItems: 'center',
              flexDirection: 'row',
            }}
          >
            <Image source={getImageSource(item.type)} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10, backgroundColor: 'white' }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', color: theme.colors.text }}>{item.type}</Text>
              {item.missing > 0 && (
                <Text style={{ color: theme.colors.error, fontWeight: 'bold' }}>
                  {`${item.missing} missing`}
                </Text>
              )}
            </View>
            <Icon name="chevron-right" size={30} color={theme.colors.onSurface} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ShelfListScreen;
