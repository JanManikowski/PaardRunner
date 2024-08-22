import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ViewBarsScreen = ({ navigation, route }) => {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    fetchBars();
  }, [route.params?.refresh]); // Listen for refresh flag

  const fetchBars = async () => {
    const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
    setBars(storedBars);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8', padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 20 }}>
        <Text h4 h4Style={{ fontSize: 24, fontWeight: 'bold' }}>Stored Bars</Text>
      </View>
      <FlatList
        data={bars}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginBottom: 20 }} onPress={() => navigation.navigate('BarDetail', { bar: item })}>
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>{item.name}</Text>
            <Text style={{ marginBottom: 5, fontSize: 16 }}>Shelves: {item.numShelves}</Text>
            <Text style={{ fontSize: 16 }}>Fridges: {item.numFridges}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={{ backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginTop: 20 }} onPress={() => navigation.navigate('ManageBars')}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>Manage Bars</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ViewBarsScreen;
