import React, { useState, useContext, useEffect } from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Text } from 'react-native-elements';
import Toast from 'react-native-toast-message';
import { FridgeContext } from '../contexts/FridgeContext';
import { ThemeContext } from '../contexts/ThemeContext';

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves, addCustomMissingItem } = useContext(FridgeContext);
  const { theme } = useContext(ThemeContext);
  const [customItem, setCustomItem] = useState('');

  useEffect(() => {
    if (!barFridges[bar.name]) {
      const initialFridges = [
        { type: 'Spa Blauw', amount: 35, missing: 0 },
        { type: 'Grolsch 0.0', amount: 18, missing: 0 },
        { type: 'Grimbergen', amount: 18, missing: 0 },
        { type: 'Radler', amount: 12, missing: 0 },
        { type: 'Spa Rood', amount: 24, missing: 0 },
        { type: 'Weizen 0.0', amount: 12, missing: 0 },
        { type: 'Viper Cranberry', amount: 6, missing: 0 },
        { type: 'Viper Peach', amount: 6, missing: 0 },
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
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `${customItem} has been added`,
        position: 'top',  // Set toast position to top
      });
      setCustomItem(''); // Clear the input after adding
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid item name.',
        position: 'top',  // Set toast position to top
      });
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color:theme.colors.text }}>
        {bar.name} Inventory
      </Text>
      <TouchableOpacity
        style={{
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
        <Text style={{ fontSize: 18, fontWeight: '600', color:theme.colors.text }}>View Fridges</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
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
          padding: 20,
          borderRadius: 8,
          marginBottom: 20,
          alignItems: 'center',
          backgroundColor: theme.colors.surfaceVariant,
        }}
        onPress={() => navigation.navigate('StrongLiquorList')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>View Strong Liquor</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
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

      <View style={{ flex: 1 }} /> 

      <TextInput
        style={{
          padding: 10,
          borderColor: theme.colors.outline,
          borderWidth: 1,
          borderRadius: 5,
          marginBottom: 20,
          color: theme.colors.text,
          backgroundColor: theme.colors.surfaceVariant,
        }}
        placeholder="Enter custom item name"
        placeholderTextColor={theme.colors.onSurface}
        value={customItem}
        onChangeText={setCustomItem}
        onSubmitEditing={handleAddCustomItem} // Automatically add the item when Enter is pressed
      />
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 5,
          width: '100%',
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={handleAddCustomItem}
      >
        <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>Add Custom Item</Text>
      </TouchableOpacity>

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
};

export default BarDetailScreen;
