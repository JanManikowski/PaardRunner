// ManageBarsScreen.js
import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const ManageBarsScreen = ({ navigation, route }) => {
  const [bars, setBars] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBar, setEditBar] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFridges, setEditFridges] = useState('');
  const [editShelves, setEditShelves] = useState('');
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (route.params?.updatedBars) {
      setBars(route.params.updatedBars);
    } else {
      fetchBars();
    }
  }, [route.params?.updatedBars]);

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
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            const filteredBars = bars.filter(bar => bar.name !== barName);
            setBars(filteredBars);
            await AsyncStorage.setItem('bars', JSON.stringify(filteredBars));
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
    setEditFridges(bar.fridges ? bar.fridges.toString() : '');
    setEditShelves(bar.shelves ? bar.shelves.toString() : '');
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
    navigation.navigate('ViewBars', { refresh: true });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, backgroundColor: theme.colors.background, flexGrow: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>Manage Bars</Text>
      {bars.map((bar, index) => (
        <View
          key={index}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 8,
            marginBottom: 10,
            padding: 15
          }}
        >
          <Text style={{ fontSize: 18, color: theme.colors.text }}>{bar.name}</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                padding: 10,
                marginRight: 10,
                borderRadius: 5
              }}
              onPress={() => editBarDetails(bar)}
            >
              <Text style={{ color: '#fff', fontSize: 14 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: "#F44336",
                padding: 10,
                borderRadius: 5
              }}
              onPress={() => deleteBar(bar.name)}
            >
              <Text style={{ color: '#fff', fontSize: 14 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Edit Bar Modal */}
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
            backgroundColor: theme.colors.surface,
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
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15, color: theme.colors.text }}>Edit Bar</Text>
            <TextInput
              style={{
                width: '100%',
                height: 40,
                borderColor: theme.colors.border,
                borderWidth: 1,
                marginBottom: 10,
                paddingHorizontal: 8,
                borderRadius: 5,
                color: theme.colors.text,
                backgroundColor: theme.colors.inputBackground
              }}
              placeholder="Name"
              placeholderTextColor={theme.colors.placeholder}
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={{
                width: '100%',
                height: 40,
                borderColor: theme.colors.border,
                borderWidth: 1,
                marginBottom: 10,
                paddingHorizontal: 8,
                borderRadius: 5,
                color: theme.colors.text,
                backgroundColor: theme.colors.inputBackground
              }}
              placeholder="Fridges"
              placeholderTextColor={theme.colors.placeholder}
              value={editFridges}
              keyboardType="numeric"
              onChangeText={setEditFridges}
            />
            <TextInput
              style={{
                width: '100%',
                height: 40,
                borderColor: theme.colors.border,
                borderWidth: 1,
                marginBottom: 10,
                paddingHorizontal: 8,
                borderRadius: 5,
                color: theme.colors.text,
                backgroundColor: theme.colors.inputBackground
              }}
              placeholder="Shelves"
              placeholderTextColor={theme.colors.placeholder}
              value={editShelves}
              keyboardType="numeric"
              onChangeText={setEditShelves}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.primary,
                  padding: 10,
                  borderRadius: 5,
                  flex: 1,
                  alignItems: 'center',
                  marginRight: 10
                }}
                onPress={saveBarDetails}
              >
                <Text style={{ color: '#fff' }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: "#F44336",
                  padding: 10,
                  borderRadius: 5,
                  flex: 1,
                  alignItems: 'center',
                }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ManageBarsScreen;
