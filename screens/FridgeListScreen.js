import React, { useContext, useState, useCallback } from 'react';
import { View, ScrollView, Image, TouchableOpacity, Text, Button } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData } from '../storage/AsyncStorageHelper';
import { Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';

const FridgeListScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barFridges } = useContext(FridgeContext);
  const [fridges, setFridges] = useState(barFridges[bar.name] || []);
  const { theme } = useContext(ThemeContext);

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
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: theme.colors.onBackground, fontSize: 24, fontWeight: 'bold' }}>
          Fridges in {bar.name}
        </Text>
        <Button
          title='Go to Shelves'
          icon={<Icon name="list" color={theme.colors.onPrimary} />}
          buttonStyle={{ backgroundColor: theme.colors.primary, borderRadius: 10 }}
          onPress={() => navigation.navigate('ShelfList', { bar: { name: bar.name } })}
        />
      </View>

      <Button
        title='Open a Case'
        onPress={() => navigation.navigate('CaseOpening')}
        buttonStyle={{
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 16,
          padding: 10,
        }}
      />

      <ScrollView>
        {fridges.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => navigation.navigate('FridgeDetail', { barName: bar.name, fridgeIndex: index })}
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
            <Image source={getImageSource(item.type)} style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }} />
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

export default FridgeListScreen;
