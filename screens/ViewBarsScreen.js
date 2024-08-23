import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';

const ViewBarsScreen = ({ navigation }) => {
  const [bars, setBars] = useState([]);

  useEffect(() => {
    const fetchBars = async () => {
      const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      setBars(storedBars);
    };

    fetchBars();
  }, []);

  const handleDragEnd = async ({ data }) => {
    setBars(data);
    await AsyncStorage.setItem('bars', JSON.stringify(data));
  };

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
      <View style={{ flex: 1 }}>
        <DraggableFlatList
          data={bars}
          keyExtractor={(item, index) => index.toString()}
          onDragEnd={handleDragEnd}
          renderItem={({ item, drag, index }) => (
            <TouchableOpacity
              style={{
                backgroundColor: '#FFF',
                padding: 15,
                borderRadius: 8,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 5,
                marginBottom: index === bars.length - 1 ? 0 : 20, // No margin at the bottom of the last item
                elevation: 2, // For Android shadow
              }}
              onLongPress={drag}
              onPress={() => navigation.navigate('BarDetail', { bar: item })}
            >
              <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>{item.name}</Text>
              <Text style={{ marginBottom: 5, fontSize: 16 }}>Shelves: {item.numShelves}</Text>
              <Text style={{ fontSize: 16 }}>Fridges: {item.numFridges}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }} // Reduce padding to ensure no extra space at the bottom
        />
      </View>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 15,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 2, // For Android shadow
          marginTop: 20,
          marginBottom: 0, // Removed the marginBottom
        }}
        onPress={() => navigation.navigate('ManageBars')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>Manage Bars</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ViewBarsScreen;
