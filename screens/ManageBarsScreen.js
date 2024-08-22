import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, Button, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ManageBarsScreen = ({ navigation, route }) => {
  const [bars, setBars] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBar, setEditBar] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFridges, setEditFridges] = useState('');
  const [editShelves, setEditShelves] = useState('');

  useEffect(() => {
    fetchBars();
  }, [route.params?.refresh]); // Listen for refresh flag

  const fetchBars = async () => {
    try {
      const storedBars = await AsyncStorage.getItem('bars');
      if (storedBars) {
        setBars(JSON.parse(storedBars));
      }
    } catch (error) {
      console.error('Failed to load bars from storage', error);
    }
  };

  const deleteBar = async (barName) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this bar?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: async () => {
            const filteredBars = bars.filter(bar => bar.name !== barName);
            setBars(filteredBars);
            await AsyncStorage.setItem('bars', JSON.stringify(filteredBars));
            // Refresh ViewBarsScreen
            navigation.navigate('ViewBars', { refresh: true });
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  const editBarDetails = (bar) => {
    setEditBar(bar);
    setEditName(bar.name);
    setEditFridges(bar.fridges ? bar.fridges.toString() : ''); // Handle potential null values
    setEditShelves(bar.shelves ? bar.shelves.toString() : ''); // Handle potential null values
    setEditModalVisible(true);
  };

  const saveBarDetails = async () => {
    const updatedBars = bars.map(bar => {
      if (bar.name === editBar.name) {
        return { ...bar, name: editName, fridges: parseInt(editFridges) || 0, shelves: parseInt(editShelves) || 0 };
      }
      return bar;
    });
    setBars(updatedBars);
    await AsyncStorage.setItem('bars', JSON.stringify(updatedBars));
    setEditModalVisible(false);
    // Refresh ViewBarsScreen
    navigation.navigate('ViewBars', { refresh: true });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: '#fff', flexGrow: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Manage Bars</Text>
      {bars.map((bar, index) => (
        <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
          <Text style={{ fontSize: 18 }}>{bar.name}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={{ backgroundColor: '#007BFF', padding: 10, marginRight: 10, borderRadius: 5 }} onPress={() => editBarDetails(bar)}>
              <Text style={{ color: '#fff', fontSize: 14 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ backgroundColor: '#FF0000', padding: 10, borderRadius: 5 }} onPress={() => deleteBar(bar.name)}>
              <Text style={{ color: '#fff', fontSize: 14 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity style={{ backgroundColor: '#28a745', padding: 10, borderRadius: 5, marginTop: 20, alignItems: 'center' }} onPress={() => navigation.navigate('AddBar')}>
        <Text style={{ color: '#fff', fontSize: 14 }}>Add New Bar</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            margin: 20,
            backgroundColor: 'white',
            borderRadius: 10,
            padding: 35,
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
            width: '80%',
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}>Edit Bar</Text>
            <TextInput
              style={{ width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 8 }}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={{ width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 8 }}
              placeholder="Fridges"
              value={editFridges}
              keyboardType="numeric"
              onChangeText={setEditFridges}
            />
            <TextInput
              style={{ width: '100%', height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, paddingHorizontal: 8 }}
              placeholder="Shelves"
              value={editShelves}
              keyboardType="numeric"
              onChangeText={setEditShelves}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <Button title="Save" onPress={saveBarDetails} />
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ManageBarsScreen;