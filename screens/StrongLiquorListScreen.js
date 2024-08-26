import React, { useContext, useState, useEffect } from 'react';
import { View, ScrollView, Image, Text, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { FridgeContext } from '../contexts/FridgeContext';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StrongLiquorListScreen = () => {
  const { strongLiquor } = useContext(FridgeContext);
  const { theme } = useContext(ThemeContext);
  const [liquorCounts, setLiquorCounts] = useState({});

  useEffect(() => {
    const loadCounts = async () => {
      const storedCounts = await AsyncStorage.getItem('liquorCounts');
      if (storedCounts) {
        setLiquorCounts(JSON.parse(storedCounts));
      } else {
        const initialCounts = strongLiquor.reduce((acc, liquor) => {
          acc[liquor] = 0;
          return acc;
        }, {});
        setLiquorCounts(initialCounts);
      }
    };

    loadCounts();
  }, [strongLiquor]);

  const updateCount = async (liquor, value) => {
    const newCount = Math.max((liquorCounts[liquor] || 0) + value, 0);
    const updatedCounts = { ...liquorCounts, [liquor]: newCount };
    setLiquorCounts(updatedCounts);
    await AsyncStorage.setItem('liquorCounts', JSON.stringify(updatedCounts));
  };

  const resetCount = async (liquor) => {
    const updatedCounts = { ...liquorCounts, [liquor]: 0 };
    setLiquorCounts(updatedCounts);
    await AsyncStorage.setItem('liquorCounts', JSON.stringify(updatedCounts));
  };

  const removeAllLiquorItems = async () => {
    await AsyncStorage.removeItem('liquorCounts');
    setLiquorCounts({});
    Alert.alert('All strong liquor items have been removed from local storage.');
  };

  const getImageSource = (type) => {
    switch (type) {
      case 'Jack Daniels':
        return require('../assets/strong/jackdaniels.jpeg');
      case 'Jameson':
        return require('../assets/strong/jameson.webp');
      case 'Southern Comfort':
        return require('../assets/strong/southern.jpg');
      case 'Vodka':
        return require('../assets/strong/vodka.webp');
      case 'Red Vodka':
        return require('../assets/strong/redvodka.png');
      case 'Rum':
        return require('../assets/strong/rum.webp');
      case 'Brown Rum':
        return require('../assets/strong/rumbrown.webp');
      case 'Bacardi Lemon':
        return require('../assets/strong/bacardilemon.jpg');
      case 'Bacardi Razz':
        return require('../assets/strong/bacardirazz.png');
      case 'Malibu':
        return require('../assets/strong/malibu.jpg');
      case 'Gin':
        return require('../assets/strong/gin.jpg');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ color: theme.colors.onBackground, fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>
        Strong Liquor
      </Text>
      
      <ScrollView>
        {strongLiquor.map((item, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => updateCount(item, 1)}
            onLongPress={() => resetCount(item)}
            style={[styles.itemContainer, { backgroundColor: theme.colors.surfaceVariant, shadowColor: theme.colors.shadow }]}
          >
            <Image 
              source={getImageSource(item)} 
              style={styles.itemImage} 
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.itemTitle, { color: theme.colors.text }]}>{item}</Text>
              {liquorCounts[item] > 0 && (
                <Text style={[styles.itemMissing, { color: theme.colors.error }]}>
                  {`${liquorCounts[item]} missing`}
                </Text>
              )}
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => updateCount(item, -1)}
                style={[styles.counterButton, { backgroundColor: theme.colors.error }]}
              >
                <Text style={styles.buttonText}>-1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => updateCount(item, 1)}
                style={[styles.counterButton, { backgroundColor: theme.colors.success }]}
              >
                <Text style={styles.buttonText}>+1</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={{ marginTop: 20 }}>
        <TouchableOpacity 
          onPress={removeAllLiquorItems}
          style={[styles.removeButton, { backgroundColor: theme.colors.error }]}
        >
          <Text style={styles.removeButtonText}>Remove All Strong Liquor Items</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    borderRadius: 10,
    marginVertical: 5,
    padding: 10,
    alignItems: 'center',
    flexDirection: 'row',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 2,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: 'white',
  },
  itemTitle: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  itemMissing: {
    fontSize: 16,
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  removeButton: {
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  removeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default StrongLiquorListScreen;
