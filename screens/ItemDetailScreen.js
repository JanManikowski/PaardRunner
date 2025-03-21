// ItemDetailScreen.js
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

  // On mount or when currentIndex changes, update currentItem
  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length) {
      setCurrentItem(items[currentIndex]);
    }
  }, [items, currentIndex]);

  // Load missing from AsyncStorage whenever currentItem changes
  useEffect(() => {
    const loadData = async () => {
      if (currentItem && currentItem.id && bar) {
        const missingKey = `missing_${currentItem.id}_${bar.orgId}_${bar.name}`;
        const savedMissing = await AsyncStorage.getItem(missingKey);
        if (savedMissing !== null) {
          setMissing(parseInt(savedMissing, 10));
        } else {
          setMissing(0);
        }
      }
    };
    loadData();
  }, [currentItem, bar]);

  // Save missing to AsyncStorage whenever missing changes
  useEffect(() => {
    const saveMissing = async () => {
      if (currentItem && currentItem.id && bar) {
        const missingKey = `missing_${currentItem.id}_${bar.orgId}_${bar.name}`;
        await AsyncStorage.setItem(missingKey, missing.toString());
      }
    };
    saveMissing();
  }, [missing, currentItem, bar]);

  // **Store this item in `items_{bar.orgId}` so MissingItemsScreen can find it.**
  useEffect(() => {
    const storeItemInList = async () => {
      if (!bar || !currentItem?.id) return;
      const itemsKey = `items_${bar.orgId}`;

      // 1) Load existing items from AsyncStorage
      let existingItems = await AsyncStorage.getItem(itemsKey);
      existingItems = existingItems ? JSON.parse(existingItems) : [];

      // 2) Update or insert the current item
      const idx = existingItems.findIndex(it => it.id === currentItem.id);
      const updatedItem = { ...currentItem, missing }; // carry current "missing" count
      if (idx >= 0) {
        existingItems[idx] = updatedItem;
      } else {
        existingItems.push(updatedItem);
      }

      // 3) Save back
      await AsyncStorage.setItem(itemsKey, JSON.stringify(existingItems));
    };
    storeItemInList();
  }, [bar, currentItem, missing]);

  // Only allow missing to be between 0 and 999
  const updateMissing = (value) => {
    setMissing((prevMissing) => {
      const newMissing = Math.max(0, Math.min(999, prevMissing + value));
      return newMissing;
    });
  };

  // Handle numeric input only, with a max of 999
  const handleChangeCustomValue = (text) => {
    // Remove any non-digit characters
    let numericText = text.replace(/[^0-9]/g, '');
    // If user typed above 999, clamp to 999
    if (parseInt(numericText, 10) > 999) {
      numericText = '999';
    }
    setCustomValue(numericText);
  };

  // Called on submit or when pressing enter
  const handleCustomValue = (isAdd) => {
    const value = parseInt(customValue, 10);
    if (!isNaN(value)) {
      updateMissing(isAdd ? value : -value);
      setCustomValue('');
    }
  };

  const clearMissing = () => {
    setMissing(0);
  };

  // Circular next/previous logic
  const goToNextItem = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % items.length);
  };

  const goToPreviousItem = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + items.length) % items.length);
  };

  if (!currentItem || items.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <Text style={{ color: theme.colors.text }}>No items available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {/* Top navigation arrows */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingTop: 100 }}>
        <Button
          icon={
            <Icon
              name="arrow-back"
              size={30}
              color={theme.colors.primary}
            />
          }
          type="clear"
          onPress={goToPreviousItem}
        />
        <Button
          icon={
            <Icon
              name="arrow-forward"
              size={30}
              color={theme.colors.primary}
            />
          }
          type="clear"
          onPress={goToNextItem}
        />
      </View>

      {/* Main Card */}
      <View
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: 10,
          padding: 16,
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        {/* Item Name and Stats */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Text
            style={{
              color: theme.colors.primary,
              fontSize: 22,
              fontWeight: 'bold',
              marginBottom: 8,
            }}
          >
            {currentItem.name || 'Unnamed Item'}
          </Text>
          <Text style={{ fontSize: 16, color: theme.colors.error, fontWeight: 'bold' }}>
            Missing: {missing}
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: 16 }}>
            Max Allowed: {currentItem.maxAmount || 'N/A'}
          </Text>
        </View>

        {/* Image + +/- Buttons */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          {/* Left Column */}
          <View style={{ alignItems: 'center', marginRight: 10 }}>
            <Button
              title="-1"
              buttonStyle={{
                backgroundColor: '#F44336',
                borderRadius: 10,
                marginBottom: 30,
                width: 80,
                height: 60,
              }}
              onPress={() => updateMissing(-1)}
            />
            <Button
              title="-5"
              buttonStyle={{
                backgroundColor: '#F44336',
                borderRadius: 10,
                width: 80,
                height: 60,
              }}
              onPress={() => updateMissing(-5)}
            />
          </View>

          {/* Center Image */}
          <Image
            source={
              currentItem.image
                ? { uri: currentItem.image }
                : require('../assets/placeholder.jpg')
            }
            style={{
              width: 150,
              height: 150,
              marginHorizontal: 20,
              borderRadius: 10,
              backgroundColor: '#fff',
            }}
          />

          {/* Right Column */}
          <View style={{ alignItems: 'center', marginLeft: 10 }}>
            <Button
              title="+1"
              buttonStyle={{
                backgroundColor: '#4CAF50',
                borderRadius: 10,
                marginBottom: 30,
                width: 80,
                height: 60,
              }}
              onPress={() => updateMissing(1)}
            />
            <Button
              title="+5"
              buttonStyle={{
                backgroundColor: '#4CAF50',
                borderRadius: 10,
                width: 80,
                height: 60,
              }}
              onPress={() => updateMissing(5)}
            />
          </View>
        </View>

        {/* Custom Value Input */}
        <Input
          placeholder="Enter a custom value"
          placeholderTextColor={theme.colors.onSurface}
          keyboardType="numeric"
          value={customValue}
          onChangeText={handleChangeCustomValue}
          containerStyle={{ marginBottom: 10 }}
          inputContainerStyle={{
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: 8,
            paddingHorizontal: 10,
            backgroundColor: theme.colors.surface,
          }}
          inputStyle={{ color: theme.colors.text, textAlign: 'center' }}
          returnKeyType="done"
          onSubmitEditing={() => handleCustomValue(true)}
        />
      </View>

      {/* Clear Missing Items */}
      <Button
        title="Clear Missing Items"
        buttonStyle={{
          backgroundColor: '#B22222',
          borderRadius: 10,
          paddingHorizontal: 20,
        }}
        titleStyle={{ fontSize: 16, fontWeight: 'bold' }}
        onPress={clearMissing}
      />

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
};

export default ItemDetailScreen;
