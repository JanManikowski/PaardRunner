import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Button, TextInput, Image, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { CategoryContext } from '../contexts/CategoryContext';
import Toast from 'react-native-toast-message';  // Toast for notifications

const ItemDetailScreen = ({ route, navigation }) => {
  const { categoryName, item, bar } = route.params;  // Get the category and item data from route params
  const { categories, updateItemInCategory } = useContext(CategoryContext);
  const { theme } = useContext(ThemeContext);
  const [currentItem, setCurrentItem] = useState(item);  // State to manage the selected item
  const [missing, setMissing] = useState(item.missing || 0);  // State for missing items
  const [customValue, setCustomValue] = useState('');  // State for custom input

  useEffect(() => {
    // Update the item in the category when the missing value changes
    const updatedItem = { ...currentItem, missing };
    updateItemInCategory(categoryName, updatedItem);
  }, [missing]);

  const updateMissing = (value) => {
    setMissing((prev) => Math.max(0, Math.min(prev + value, currentItem.maxAmount)));
  };

  const handleCustomValueChange = (isAdd) => {
    const value = parseInt(customValue, 10);
    if (!isNaN(value)) {
      updateMissing(isAdd ? value : -value);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Invalid Input',
        text2: 'Please enter a valid number.',
      });
    }
    setCustomValue('');  // Clear the custom input field after processing
  };

  const clearMissing = () => {
    setMissing(0);  // Clear the missing value
  };

  const getImageSource = () => {
    return currentItem.image ? { uri: currentItem.image } : require('../assets/placeholder.jpg');
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {/* Item details */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.primary }}>
          {currentItem.name}
        </Text>
        <Text style={{ fontSize: 16, color: '#d32f2f', fontWeight: 'bold' }}>
          Missing Items: {missing}
        </Text>
        <Text style={{ fontSize: 16, color: theme.colors.text }}>
          Max Allowed: {currentItem.maxAmount}
        </Text>
      </View>

      {/* Display Image */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Image
          source={getImageSource()}
          style={{ width: 150, height: 150, borderRadius: 10, backgroundColor: 'white' }}
        />
      </View>

      {/* Adjust Missing Items with Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 }}>
        <Button title="-5" onPress={() => updateMissing(-5)} />
        <Button title="-1" onPress={() => updateMissing(-1)} />
        <Button title="+1" onPress={() => updateMissing(1)} />
        <Button title="+5" onPress={() => updateMissing(5)} />
      </View>

      {/* Custom Value Input */}
      <TextInput
        placeholder="Enter custom value"
        value={customValue}
        onChangeText={setCustomValue}
        keyboardType="numeric"
        style={{
          borderColor: theme.colors.outline,
          borderWidth: 1,
          padding: 10,
          borderRadius: 5,
          marginBottom: 20,
          textAlign: 'center',
          color: theme.colors.text,
        }}
      />

      {/* Buttons to Add or Subtract Custom Value */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 }}>
        <Button title="Add Custom Value" onPress={() => handleCustomValueChange(true)} />
        <Button title="Subtract Custom Value" onPress={() => handleCustomValueChange(false)} />
      </View>

      {/* Clear Missing Items */}
      <TouchableOpacity
        style={{
          backgroundColor: '#B22222',
          paddingVertical: 10,
          paddingHorizontal: 20,
          borderRadius: 5,
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={clearMissing}
      >
        <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
          Clear Missing Items
        </Text>
      </TouchableOpacity>

      {/* Toast Notifications */}
      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
};

export default ItemDetailScreen;
