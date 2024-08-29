// BarDetailScreen.js
import React, { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity, TextInput, Alert, Modal, Button } from 'react-native';
import { Text } from 'react-native-elements';
import { FridgeContext } from '../contexts/FridgeContext';
import { ThemeContext } from '../contexts/ThemeContext';

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves, addCustomMissingItem } = useContext(FridgeContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [customItem, setCustomItem] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!barFridges[bar.name]) {
      const initialFridges = [
        { type: 'Spa Blauw', amount: 35, missing: 0 },
        { type: 'Grolsch 0.0', amount: 18, missing: 0 },
        { type: 'Grimbergen', amount: 18, missing: 0 },
        { type: 'Radler', amount: 12, missing: 0 },
        { type: 'Spa Rood', amount: 24, missing: 0 },
        { type: 'Weizen 0.0', amount: 12, missing: 0 },
        { type: 'Bok', amount: 6, missing: 0 },
        { type: 'IPA', amount: 12, missing: 0 },
      ];
      setBarFridges(prev => ({ ...prev, [bar.name]: initialFridges }));
    }
  }, [bar.name, barFridges, setBarFridges]);

  useEffect(() => {
    if (!barShelves[bar.name]) {
      const initialShelves = [
        { type: '7up', amount: 4, missing: 0 },
        { type: 'Sisi', amount: 4, missing: 0 },
        { type: 'Icetea Green', amount: 4, missing: 0 },
        { type: 'Tonic', amount: 4, missing: 0 },
        { type: 'Apple Juice', amount: 2, missing: 0 },
        { type: 'Orange Juice', amount: 2, missing: 0 },
        { type: 'Cassis', amount: 2, missing: 0 },
        { type: 'Bitter Lemon', amount: 2, missing: 0 },
        { type: 'White Wine', amount: 8, missing: 0 },
        { type: 'Rose', amount: 4, missing: 0 },
        { type: 'Sweet Wine', amount: 4, missing: 0 },
        { type: 'Ginger Beer', amount: 4, missing: 0 },
        { type: 'Ginger Ale', amount: 4, missing: 0 },
      ];
      setBarShelves(prev => ({ ...prev, [bar.name]: initialShelves }));
    }
  }, [bar.name, barShelves, setBarShelves]);

  if (!bar) {
    console.error("No bar data found in route parameters");
    return null;
  }

  const handleAddCustomItem = () => {
    if (customItem.trim()) {
      addCustomMissingItem(bar.name, customItem);
      Alert.alert('Success', `${customItem} added to missing items.`);
      setCustomItem(''); // Clear the input after adding
      setModalVisible(false); // Close the modal
    } else {
      Alert.alert('Error', 'Please enter a valid item name.');
    }
  };

  return (
    <View style={{ padding: 16, backgroundColor: theme.colors.background, flex: 1 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color:theme.colors.text }}>
        {bar.name} Inventory
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceVariant,
        }}
        onPress={() => navigation.navigate('FridgeList', { bar })}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color:theme.colors.text  }}>View Fridges</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceVariant,
        }}
        onPress={() => navigation.navigate('ShelfList', { bar })}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color:theme.colors.text }}>View Shelves</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('StrongLiquorList')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>View Strong Liquor</Text>
      </TouchableOpacity>

      {/* Button to open the modal */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={() => setModalVisible(true)} // Open the modal
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
          Add Custom Missing Item
        </Text>
      </TouchableOpacity>

      {/* Modal for adding a custom item */}
      <Modal
  animationType="slide"
  transparent={true}
  visible={modalVisible}
  onRequestClose={() => setModalVisible(false)}
>
  <View style={{
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  }}>
    <View style={{
      width: 300,
      padding: 20,
      backgroundColor: theme.colors.background,
      borderRadius: 10,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5, // For Android shadow
    }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        Add Custom Item
      </Text>
      <TextInput
        style={{
          width: '100%',
          padding: 10,
          borderColor: theme.colors.outline,
          borderWidth: 1,
          borderRadius: 5,
          marginBottom: 20,
          color: theme.colors.text,
          backgroundColor: theme.colors.surfaceVariant,
        }}
        placeholder="Enter item name"
        placeholderTextColor={theme.colors.onSurface}
        value={customItem}
        onChangeText={setCustomItem}
      />
      <TouchableOpacity
        style={{
          backgroundColor: "#4CAF50",
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 5,
          width: '100%',
          alignItems: 'center',
          marginBottom: 10,
        }}
        onPress={handleAddCustomItem}
      >
        <Text style={{ color: theme.colors, fontWeight: 'bold' }}>Add Item</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: "#F44336",
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 5,
          width: '100%',
          alignItems: 'center',
        }}
        onPress={() => setModalVisible(false)}
      >
        <Text style={{ color: theme.colors.onError, fontWeight: 'bold' }}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceVariant,
        }}
        onPress={() => navigation.navigate('MissingItems', { bar })}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color:theme.colors.text }}>View Missing Items</Text>
      </TouchableOpacity>

      
    </View>
  );
};

export default BarDetailScreen;
