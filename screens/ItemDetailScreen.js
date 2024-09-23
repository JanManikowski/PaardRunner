import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Image } from 'react-native';
import { Button, Input } from 'react-native-elements';  // Use react-native-elements Button and Input
import { ThemeContext } from '../contexts/ThemeContext';
import { CategoryContext } from '../contexts/CategoryContext';
import Toast from 'react-native-toast-message';  // Toast for notifications
import Icon from 'react-native-vector-icons/MaterialIcons';  // For arrow icons

const ItemDetailScreen = ({ route, navigation }) => {
  const { categoryName, item, bar } = route.params;  // Get the category and item data from route params
  const { categories, updateItemInCategory } = useContext(CategoryContext);  // Access the items in the category
  const { theme } = useContext(ThemeContext);

  // Find all items in the current category
  const itemsInCategory = categories[categoryName] || [];
  
  // Find the current item index in the category
  const initialIndex = itemsInCategory.findIndex((i) => i.name === item.name);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);  // State to track the current item index
  const [currentItem, setCurrentItem] = useState(itemsInCategory[currentIndex]);  // State to manage the selected item
  const [missing, setMissing] = useState(currentItem.missing || 0);  // State for missing items
  const [customValue, setCustomValue] = useState('');  // State for custom input

  // Update the current item details when the index changes
  useEffect(() => {
    setCurrentItem(itemsInCategory[currentIndex]);
    setMissing(itemsInCategory[currentIndex].missing || 0);  // Reset the missing value when switching items
  }, [currentIndex]);

  // Update the missing value in the local storage (or context) when it changes
  useEffect(() => {
    const updatedItem = { ...currentItem, missing };
    updateItemInCategory(categoryName, updatedItem);  // Update the item in the category context
  }, [missing]);

  // Function to update the missing count
  const updateMissing = (value) => {
    setMissing((prev) => Math.max(0, Math.min(prev + value, currentItem.maxAmount)));
  };

  // Function to handle custom value input
  const handleCustomValue = (isAdd) => {
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
    setCustomValue('');  // Clear the input field after applying the value
  };

  // Clear the missing items count
  const clearMissing = () => {
    setMissing(0);
  };

  // Get the image source for the item (use a placeholder if none is provided)
  const getImageSource = () => {
    return currentItem.image ? { uri: currentItem.image } : require('../assets/placeholder.jpg');
  };

  // Navigation: Go to the previous item
  const goToPreviousItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  // Navigation: Go to the next item
  const goToNextItem = () => {
    if (currentIndex < itemsInCategory.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      
      {/* Arrow Buttons to Navigate Between Items */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button
          icon={<Icon name="arrow-back" size={30} color={currentIndex === 0 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToPreviousItem}
          disabled={currentIndex === 0}  // Disable if it's the first item
        />
        <Button
          icon={<Icon name="arrow-forward" size={30} color={currentIndex === itemsInCategory.length - 1 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToNextItem}
          disabled={currentIndex === itemsInCategory.length - 1}  // Disable if it's the last item
        />
      </View>

      <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 10, marginBottom: 25 }}>
        
        {/* Item Details */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.primary, marginBottom: 10 }}>
            {currentItem.name}
          </Text>
          <Text style={{ fontSize: 16, color: '#d32f2f', fontWeight: 'bold' }}>
            Missing Items: {missing}
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: 16 }}>
            Max Allowed: {currentItem.maxAmount}
          </Text>
        </View>

        {/* Update Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
          <View style={{ justifyContent: 'space-between', height: 120 }}>
            <Button
              title="-1"
              buttonStyle={{ backgroundColor: '#F44336', borderRadius: 10 }}
              onPress={() => updateMissing(-1)}
              containerStyle={{ width: 60, marginBottom: 10 }}
            />
            <Button
              title="-5"
              buttonStyle={{ backgroundColor: '#F44336', borderRadius: 10 }}
              onPress={() => updateMissing(-5)}
              containerStyle={{ width: 60 }}
            />
          </View>
          
          {/* Item Image */}
          <Image
            source={getImageSource()}
            style={{ width: 150, height: 150, marginHorizontal: 20, borderRadius: 10, backgroundColor: 'white' }}
          />

          <View style={{ justifyContent: 'space-between', height: 120 }}>
            <Button
              title="+1"
              buttonStyle={{ backgroundColor: '#4CAF50', borderRadius: 10 }}
              onPress={() => updateMissing(1)}
              containerStyle={{ width: 60, marginBottom: 10 }}
            />
            <Button
              title="+5"
              buttonStyle={{ backgroundColor: '#4CAF50', borderRadius: 10 }}
              onPress={() => updateMissing(5)}
              containerStyle={{ width: 60 }}
            />
          </View>
        </View>

        {/* Custom Value Input */}
        <Input
          placeholder="Custom value"
          keyboardType="numeric"
          value={customValue}
          onChangeText={setCustomValue}
          containerStyle={{ marginBottom: 20, width: '80%', alignSelf: 'center' }}
          inputStyle={{ textAlign: 'center' }}
        />

      </View>

      {/* Buttons to Add or Retract Custom Value */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 }}>
        <Button
          title="Retract Value"
          buttonStyle={{ backgroundColor: '#F44336', borderRadius: 10 }}
          containerStyle={{ flex: 1, marginRight: 10 }}
          onPress={() => handleCustomValue(false)}
        />
        <Button
          title="Add Value"
          buttonStyle={{ backgroundColor: '#4CAF50', borderRadius: 10 }}
          containerStyle={{ flex: 1, marginLeft: 10 }}
          onPress={() => handleCustomValue(true)}
        />
      </View>

      {/* Clear Missing Items Button */}
      <Button
        title="Clear Missing Items"
        buttonStyle={{ backgroundColor: '#B22222', borderRadius: 10, paddingHorizontal: 20 }}
        titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
        onPress={clearMissing}
        containerStyle={{ alignItems: 'center' }}
      />

      {/* Navigate to Shelves */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
        <Button
          title="Go to Shelves"
          buttonStyle={{ backgroundColor: '#00796b', borderRadius: 10 }}
          onPress={() => navigation.reset({
            index: 1,
            routes: [
              { name: 'BarDetail', params: { bar: { name: bar.name } } },
              { name: 'ShelfList', params: { bar: { name: bar.name } } },
            ],
          })}
        />
      </View>
    </View>
  );
};

export default ItemDetailScreen;
