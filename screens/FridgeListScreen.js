import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData } from '../storage/AsyncStorageHelper';

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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fridges in {bar.name}</Text>
      <ScrollView>
        {fridges.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.itemContainer}
            onPress={() => navigation.navigate('FridgeDetail', { barName: bar.name, fridgeIndex: index })}
          >
            <Text style={styles.itemText}>{item.type}</Text>
            <Text style={styles.missingText}>{item.missing > 0 ? `${item.missing} missing` : ''}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
  },
  missingText: {
    fontSize: 16,
    color: 'red',
  },
});

export default FridgeListScreen;
