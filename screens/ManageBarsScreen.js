import React, { useState, useEffect, useContext } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ThemeContext } from '../contexts/ThemeContext';

const ManageBarsScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [bars, setBars] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState('');
  const [manageMode, setManageMode] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBar, setEditBar] = useState(null);
  const [editName, setEditName] = useState('');

  // Load bars when the screen gains focus and reset manage mode on blur
  useEffect(() => {
    const loadBars = async () => {
      const orgId = await AsyncStorage.getItem('activeOrgId');
      setActiveOrgId(orgId);
      const storedBars = JSON.parse(await AsyncStorage.getItem(`bars_${orgId}`)) || [];
      setBars(storedBars.sort((a, b) => a.order - b.order));
    };

    const unsubscribeFocus = navigation.addListener('focus', () => {
      loadBars();
    });
    const unsubscribeBlur = navigation.addListener('blur', () => {
      setManageMode(false);
    });
    loadBars();
    return () => {
      unsubscribeFocus();
      unsubscribeBlur();
    };
  }, [navigation]);

  // Handle drag and drop reordering.
  const handleDragEnd = async ({ data }) => {
    const sortedBars = data.map((bar, index) => ({ ...bar, order: index }));
    setBars(sortedBars);
    await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(sortedBars));
  };

  // Delete a bar.
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

  // Open the edit modal for a bar.
  const editBarDetails = (bar) => {
    setEditBar(bar);
    setEditName(bar.name);
    setEditModalVisible(true);
  };

  // Save the edited bar details.
  const saveBarDetails = async () => {
    const updatedBars = bars.map((bar) =>
      bar.id === editBar.id ? { ...bar, name: editName } : bar
    );
    setBars(updatedBars);
    await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(updatedBars));
    setEditModalVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      {/* Title */}
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        Manage Bars
      </Text>

      {/* Add New Bar button */}
      <TouchableOpacity
        style={{
          padding: 12,
          backgroundColor: theme.colors.primary,
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
        onPress={() => navigation.navigate('AddBar')}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 18 }}>Add New Bar</Text>
      </TouchableOpacity>

      {/* Header for bars list */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>Bars</Text>
        <TouchableOpacity
          style={{
            backgroundColor: manageMode ? theme.colors.error : theme.colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 5,
          }}
          onPress={() => setManageMode(!manageMode)}
        >
          <Text style={{ color: manageMode ? theme.colors.onError : theme.colors.onPrimary }}>
            {manageMode ? 'Done' : 'Manage'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bars list */}
      <DraggableFlatList
        data={bars}
        keyExtractor={(item) => item.id}
        onDragEnd={handleDragEnd}
        renderItem={({ item, drag, isActive }) => (
          <View
            style={{
              padding: 15,
              backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
              borderRadius: 8,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {/* Bar name container */}
            <TouchableOpacity onLongPress={drag} style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, color: theme.colors.text }}>{item.name}</Text>
            </TouchableOpacity>
            {/* Fixed-width container for manage buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', width: 120, justifyContent: 'flex-end' }}>
              {manageMode && (
                <>
                  <TouchableOpacity
                    onPress={() => editBarDetails(item)}
                    style={{
                      backgroundColor: theme.colors.primary,
                      padding: 8,
                      borderRadius: 5,
                      marginRight: 8,
                    }}
                  >
                    <Text style={{ color: theme.colors.onPrimary }}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => deleteBar(item.name)}
                    style={{ backgroundColor: theme.colors.error, padding: 8, borderRadius: 5 }}
                  >
                    <Text style={{ color: theme.colors.onError }}>Delete</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
      />

      {/* Modern Editing Modal */}
<Modal animationType="fade" transparent={true} visible={editModalVisible}>
  <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
    <View
      style={{
        width: '85%',
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontWeight: '600',
          marginBottom: 15,
          textAlign: 'center',
          color: theme.colors.text,
        }}
      >
        Edit Bar
      </Text>
      <TextInput
        value={editName}
        onChangeText={setEditName}
        placeholder="Bar Name"
        placeholderTextColor={theme.colors.onSurface}
        style={{
          borderBottomWidth: 1,
          borderColor: theme.colors.border,
          paddingVertical: 8,
          marginBottom: 20,
          fontSize: 16,
          color: theme.colors.text,
        }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={saveBarDetails}
          style={{
            flex: 1,
            backgroundColor: theme.colors.primary,
            paddingVertical: 12,
            borderRadius: 8,
            marginRight: 5,
          }}
        >
          <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: theme.colors.onPrimary }}>
            Save
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setEditModalVisible(false)}
          style={{
            flex: 1,
            backgroundColor: theme.colors.error,
            paddingVertical: 12,
            borderRadius: 8,
            marginLeft: 5,
          }}
        >
          <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '600', color: theme.colors.onError }}>
            Cancel
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>

    </View>
  );
};

export default ManageBarsScreen;
