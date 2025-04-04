import React, { useState, useContext, useEffect } from 'react';
import { View, Image } from 'react-native';
import { Text, Button, Input, Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { normalize } from '../utils/normalize';

const ItemDetailScreen = ({ route }) => {
  const { bar, items: initialItems = [], itemIndex: initialItemIndex = 0 } = route.params || {};
  const { theme } = useContext(ThemeContext);

  const [items, setItems] = useState(initialItems);
  const [currentIndex, setCurrentIndex] = useState(initialItemIndex);
  const [currentItem, setCurrentItem] = useState(initialItems[initialItemIndex] || {});
  const [missing, setMissing] = useState(currentItem?.missing || 0);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    if (items.length > 0 && currentIndex < items.length) {
      const nextItem = items[currentIndex];
      setCurrentItem(nextItem);
      setMissing(typeof nextItem.missing === 'number' ? nextItem.missing : 0);
    }
  }, [items, currentIndex]);

  useEffect(() => {
    const loadData = async () => {
      if (currentItem && currentItem.id && bar) {
        const key = `missing_${currentItem.id}_${bar.orgId}_${bar.name}`;
        if (typeof currentItem.missing === 'number') setMissing(currentItem.missing);

        const saved = await AsyncStorage.getItem(key);
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed !== currentItem.missing) setMissing(parsed);
      }
    };
    loadData();
  }, [currentItem, bar]);

  useEffect(() => {
    const saveData = async () => {
      if (currentItem && currentItem.id && bar) {
        const key = `missing_${currentItem.id}_${bar.orgId}_${bar.name}`;
        await AsyncStorage.setItem(key, missing.toString());
      }
    };
    saveData();
  }, [missing, currentItem, bar]);

  useEffect(() => {
    const storeItem = async () => {
      if (!bar || !currentItem?.id) return;
      const key = `items_${bar.orgId}`;
      let stored = await AsyncStorage.getItem(key);
      stored = stored ? JSON.parse(stored) : [];

      const idx = stored.findIndex(it => it.id === currentItem.id);
      const updated = { ...currentItem, missing };
      if (idx >= 0) stored[idx] = updated;
      else stored.push(updated);

      await AsyncStorage.setItem(key, JSON.stringify(stored));
    };
    storeItem();
  }, [bar, currentItem, missing]);

  const updateMissing = (value) => {
    setMissing(prev => Math.max(0, Math.min(999, prev + value)));
  };

  const handleChangeCustomValue = (text) => {
    let num = text.replace(/[^0-9]/g, '');
    if (parseInt(num, 10) > 999) num = '999';
    setCustomValue(num);
  };

  const handleCustomValue = (isAdd) => {
    const val = parseInt(customValue, 10);
    if (!isNaN(val)) {
      updateMissing(isAdd ? val : -val);
      setCustomValue('');
    }
  };

  const clearMissing = () => setMissing(0);

  const goToNextItem = () => setCurrentIndex((prev) => (prev + 1) % items.length);
  const goToPreviousItem = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

  if (!currentItem || items.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.text }}>No items available</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: normalize(16), backgroundColor: theme.colors.background }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: normalize(16), paddingTop: normalize(100) }}>
        <Button
          icon={<Icon name="arrow-back" size={normalize(30)} color={theme.colors.primary} />}
          type="clear"
          onPress={goToPreviousItem}
        />
        <Button
          icon={<Icon name="arrow-forward" size={normalize(30)} color={theme.colors.primary} />}
          type="clear"
          onPress={goToNextItem}
        />
      </View>

      <View
        style={{
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: normalize(10),
          padding: normalize(16),
          marginBottom: normalize(20),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
      >
        <View style={{ alignItems: 'center', marginBottom: normalize(20) }}>
          <Text style={{ color: theme.colors.primary, fontSize: normalize(22), fontWeight: 'bold', marginBottom: normalize(8) }}>
            {currentItem.name || 'Unnamed Item'}
          </Text>
          <Text style={{ fontSize: normalize(16), color: theme.colors.error, fontWeight: 'bold' }}>
            Missing: {missing}
          </Text>
          <Text style={{ color: theme.colors.text, fontSize: normalize(16) }}>
            Max Allowed: {currentItem.maxAmount || 'N/A'}
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: normalize(10),
            marginBottom: normalize(20),
          }}
        >
          <View style={{ alignItems: 'center', flex: 1, marginRight: normalize(60) }}>
            <Button
              title="-1"
              buttonStyle={{
                backgroundColor: '#F44336',
                borderRadius: normalize(10),
                marginBottom: normalize(25),
                width: normalize(70),
                height: normalize(60),
              }}
              onPress={() => updateMissing(-1)}
            />
            <Button
              title="-5"
              buttonStyle={{
                backgroundColor: '#F44336',
                borderRadius: normalize(10),
                width: normalize(70),
                height: normalize(60),
              }}
              onPress={() => updateMissing(-5)}
            />
          </View>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <Image
              source={
                currentItem.image
                  ? { uri: currentItem.image }
                  : require('../assets/placeholder.jpg')
              }
              style={{
                width: normalize(150),
                height: normalize(150),
                borderRadius: normalize(10),
                backgroundColor: '#fff',
              }}
            />
          </View>

          <View style={{ alignItems: 'center', flex: 1, marginLeft: normalize(60) }}>
            <Button
              title="+1"
              buttonStyle={{
                backgroundColor: '#4CAF50',
                borderRadius: normalize(10),
                marginBottom: normalize(25),
                width: normalize(70),
                height: normalize(60),
              }}
              onPress={() => updateMissing(1)}
            />
            <Button
              title="+5"
              buttonStyle={{
                backgroundColor: '#4CAF50',
                borderRadius: normalize(10),
                width: normalize(70),
                height: normalize(60),
              }}
              onPress={() => updateMissing(5)}
            />
          </View>
        </View>

        <Input
          placeholder="Enter a custom value"
          placeholderTextColor={theme.colors.onSurface}
          keyboardType="numeric"
          value={customValue}
          onChangeText={handleChangeCustomValue}
          containerStyle={{ marginBottom: normalize(10) }}
          inputContainerStyle={{
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: normalize(8),
            paddingHorizontal: normalize(10),
            backgroundColor: theme.colors.surface,
          }}
          inputStyle={{ color: theme.colors.text, textAlign: 'center' }}
          returnKeyType="done"
          onSubmitEditing={() => handleCustomValue(true)}
        />
      </View>

      <Button
        title="Clear Missing Items"
        buttonStyle={{
          backgroundColor: '#B22222',
          borderRadius: normalize(10),
          paddingHorizontal: normalize(20),
        }}
        titleStyle={{ fontSize: normalize(16), fontWeight: 'bold' }}
        onPress={clearMissing}
      />

      <Toast />
    </View>
  );
};

export default ItemDetailScreen;
