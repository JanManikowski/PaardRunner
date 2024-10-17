import React, { useState, useContext, useEffect } from 'react';
import { View, Image } from 'react-native';
import { Text, Button, Input, Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const ItemDetailScreen = ({ route, navigation }) => {
  const { bar, items: initialItems = [], itemIndex: initialItemIndex = 0 } = route.params || {};
  const { theme } = useContext(ThemeContext);

  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(initialItemIndex);
  const [currentItem, setCurrentItem] = useState(initialItems[initialItemIndex] || {});
  const [missing, setMissing] = useState(currentItem?.missing || 0);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length) {
      setCurrentItem(items[currentIndex]);
    }
    console.log('Current item:', currentItem); // Log current item for debugging
  }, [items, currentIndex]);

  useEffect(() => {
    // Fetch missing data if it changes
    const loadData = async () => {
      if (currentItem && currentItem.id) {
        const savedMissing = await AsyncStorage.getItem(`item_${currentItem.id}_missing`);
        if (savedMissing !== null) {
          setMissing(parseInt(savedMissing, 10));
        }
      }
    };
    loadData();
  }, [currentItem]);

  useEffect(() => {
    // Save missing data whenever it changes
    const saveMissing = async () => {
      if (currentItem && currentItem.id) {
        await AsyncStorage.setItem(`item_${currentItem.id}_missing`, missing.toString());
      }
    };
    saveMissing();
  }, [missing, currentItem]);

  const updateMissing = (value) => {
    setMissing((prevMissing) => {
      const newMissing = Math.max(0, prevMissing + value);
      return newMissing;
    });
  };

  const handleCustomValue = (isAdd) => {
    const value = parseInt(customValue, 10);
    if (!isNaN(value)) {
      updateMissing(isAdd ? value : -value);
    }
  };

  const clearMissing = () => {
    setMissing(0);
  };

  const goToNextItem = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const goToPreviousItem = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  if (!currentItem || items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>No items available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {/* Arrow Buttons for navigating between items */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button
          icon={<Icon name="arrow-back" size={30} color={currentIndex === 0 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToPreviousItem}
          disabled={currentIndex === 0}
        />
        <Button
          icon={<Icon name="arrow-forward" size={30} color={currentIndex === items.length - 1 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToNextItem}
          disabled={currentIndex === items.length - 1}
        />
      </View>

      <View style={{ backgroundColor: theme.colors.surfaceVariant, borderRadius: 10, marginBottom: 25 }}>
        {/* Item Details */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text h4 style={{ color: theme.colors.primary, marginBottom: 10 }}>{currentItem.name || 'Unnamed Item'}</Text>
          <Text style={{ fontSize: 16, color: '#d32f2f', fontWeight: 'bold' }}>Missing Items: {missing}</Text>
          <Text style={{ color: theme.colors.text, fontSize: 16 }}>Max Allowed: {currentItem.maxAmount || 'N/A'}</Text>
        </View>

        {/* Update Buttons */}
        <View
          style={{
            backgroundColor: theme.colors.surfaceVariant,
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
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
          <Image
            source={currentItem.image ? { uri: currentItem.image } : require('../assets/placeholder.jpg')}
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

        <Input
          placeholder="Custom value"
          keyboardType="numeric"
          value={customValue}
          onChangeText={setCustomValue}
          containerStyle={{ marginBottom: 20, width: '80%', alignSelf: 'center' }}
          inputStyle={{ textAlign: 'center' }}
        />
      </View>

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

      <Button
        title="Clear Missing Items"
        buttonStyle={{ backgroundColor: '#B22222', borderRadius: 10, paddingHorizontal: 20 }}
        titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
        onPress={clearMissing}
        containerStyle={{ alignItems: 'center' }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
        {/* Navigation Button */}
        <Button
          title="Go to Category List"
          buttonStyle={{ backgroundColor: '#00796b', borderRadius: 10 }}
          onPress={() => navigation.navigate('CategoryList', { categoryName: currentItem.categoryName, bar })}
        />
      </View>

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
};

export default ItemDetailScreen;
