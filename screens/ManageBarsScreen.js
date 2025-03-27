import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ThemeContext } from '../contexts/ThemeContext';

const ManageBarsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [bars, setBars] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState('');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBar, setEditBar] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const loadBars = async () => {
      const orgId = await AsyncStorage.getItem('activeOrgId');
      setActiveOrgId(orgId);
      const storedBars = JSON.parse(await AsyncStorage.getItem(`bars_${orgId}`)) || [];
      setBars(storedBars.sort((a, b) => a.order - b.order));
    };
    loadBars();
  }, []);

  const handleDragEnd = async ({ data }) => {
    const sortedBars = data.map((bar, index) => ({ ...bar, order: index }));
    setBars(sortedBars);
    await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(sortedBars));
  };

  const deleteBar = (barName) => {
    Alert.alert('Confirm Delete', 'Delete this bar?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedBars = bars.filter((bar) => bar.name !== barName);
          setBars(updatedBars);
          await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(updatedBars));
        },
      },
    ]);
  };

  const editBarDetails = (bar) => {
    setEditBar(bar);
    setEditName(bar.name);
    setEditModalVisible(true);
  };

  const saveBarDetails = async () => {
    const updatedBars = bars.map((bar) =>
      bar.name === editBar.name ? { ...bar, name: editName } : bar
    );
    setBars(updatedBars);
    await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(updatedBars));
    setEditModalVisible(false);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>Manage Bars</Text>

      <DraggableFlatList
        data={bars}
        keyExtractor={(item) => item.name}
        onDragEnd={handleDragEnd}
        renderItem={({ item, drag, isActive }) => (
          <View
            style={{
              padding: 15,
              backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
              borderRadius: 8,
              marginVertical: 5,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <TouchableOpacity onLongPress={drag} style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: theme.colors.text }}>{item.name}</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={() => editBarDetails(item)}
                style={{ backgroundColor: theme.colors.primary, padding: 8, borderRadius: 5, marginRight: 8 }}
              >
                <Text style={{ color: '#fff' }}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => deleteBar(item.name)}
                style={{ backgroundColor: theme.colors.error, padding: 8, borderRadius: 5 }}
              >
                <Text style={{ color: '#fff' }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal animationType="slide" transparent={true} visible={editModalVisible}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ padding: 20, backgroundColor: theme.colors.surface, borderRadius: 10, width: '80%' }}>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              style={{ borderColor: theme.colors.border, borderWidth: 1, padding: 10, borderRadius: 5, color: theme.colors.text }}
            />
            <TouchableOpacity
              onPress={saveBarDetails}
              style={{ backgroundColor: theme.colors.primary, padding: 10, marginTop: 10, borderRadius: 5 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={{ backgroundColor: theme.colors.error, padding: 10, marginTop: 10, borderRadius: 5 }}
            >
              <Text style={{ color: '#fff', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManageBarsScreen;