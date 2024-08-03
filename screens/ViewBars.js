import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { Icon, Text } from 'react-native-elements';
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
    <View style={{ flex: 1, backgroundColor: '#F8F8F8', padding: 20 }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 20,
      }}>
        <Text h4 h4Style={{ fontSize: 24, fontWeight: 'bold' }}>Stored Bars</Text>
      </View>
      <FlatList
        data={bars}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: '#FFF',
              padding: 15,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              marginBottom: 20,
              elevation: 2, // For Android shadow
            }}
            onPress={() => navigation.navigate('BarDetail', { bar: item })}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>{item.name}</Text>
            <Text style={{ marginBottom: 5, fontSize: 16 }}>Shelves: {item.numShelves}</Text>
            <Text style={{ fontSize: 16 }}>Fridges: {item.numFridges}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ViewBars;
