import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ViewBars = ({ navigation }) => {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    const fetchBars = async () => {
      const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      setBars(storedBars);
    };

    fetchBars();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stored Bars</Text>
      <FlatList
        data={bars}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.barItem}
            onPress={() => navigation.navigate('BarDetail', { bar: item })}
          >
            <Text style={styles.barName}>{item.name}</Text>
            <Text>Shelves: {item.numShelves}</Text>
            <Text>Fridges: {item.numFridges}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
  barItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: '100%',
  },
  barName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ViewBars;
