import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, TextInput, Modal, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const [bars, setBars] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBar, setEditBar] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFridges, setEditFridges] = useState('');
  const [editShelves, setEditShelves] = useState('');

  useEffect(() => {
    fetchBars();
  }, []);

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
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Settings</Text>
      {bars.map((bar, index) => (
        <View key={index} style={styles.barContainer}>
          <Text style={styles.barText}>{bar.name}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.editButton} onPress={() => editBarDetails(bar)}>
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => deleteBar(bar.name)}>
              <Text style={styles.buttonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddBar')}
      >
        <Text style={styles.buttonText}>Add New Bar</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Edit Bar</Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={editName}
              onChangeText={setEditName}
            />
            <TextInput
              style={styles.input}
              placeholder="Fridges"
              value={editFridges}
              keyboardType="numeric"
              onChangeText={setEditFridges}
            />
            <TextInput
              style={styles.input}
              placeholder="Shelves"
              value={editShelves}
              keyboardType="numeric"
              onChangeText={setEditShelves}
            />
            <View style={styles.modalButtonContainer}>
              <Button title="Save" onPress={saveBarDetails} />
              <Button title="Cancel" onPress={() => setEditModalVisible(false)} />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  barContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  barText: {
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#007BFF',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 5,
  },
  addButton: {
    backgroundColor: '#28a745',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 8,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});

export default SettingsScreen;
