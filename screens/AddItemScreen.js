import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const ItemEditorScreen = ({ route, navigation }) => {
  const { categoryName, item } = route.params || {};
  const { theme } = useContext(ThemeContext);

  const [itemName, setItemName] = useState(item ? item.name : '');
  const [maxAmount, setMaxAmount] = useState(item ? item.maxAmount?.toString() : '');
  const [image, setImage] = useState(item ? item.image : null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'We need camera roll permissions to select images.');
      return;
    }
  
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
  
    if (!result.canceled) {
      const pickedUri = result.assets[0].uri;
      const fileName = pickedUri.split('/').pop();
      const newPath = FileSystem.documentDirectory + fileName;
  
      try {
        await FileSystem.copyAsync({
          from: pickedUri,
          to: newPath,
        });
        setImage(newPath); // store local file path, not base64
      } catch (error) {
        console.error('Error saving image locally:', error);
      }
    }
  };
  
  

  const handleSaveItem = async () => {
    if (itemName.trim() === '') {
      Alert.alert('Error', 'Item name is required');
      return;
    }
  
    const numericMaxAmount = parseInt(maxAmount, 10);
  
    if (isNaN(numericMaxAmount) || numericMaxAmount <= 0) {
      Alert.alert('Error', 'Max amount must be greater than 0');
      return;
    }
  
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }
  
      const storageKey = `categories_${activeOrgId}`;
      const storedCategories = await AsyncStorage.getItem(storageKey);
      let categories = storedCategories ? JSON.parse(storedCategories) : [];
  
      // Check for duplicate item name
      const category = categories.find(cat => cat.name === categoryName);
  
      if (category) {
        const itemExists = category.items?.some(i => i.name.toLowerCase() === itemName.toLowerCase() && i.id !== (item ? item.id : ''));
  
        if (itemExists) {
          Alert.alert('Error', 'An item with this name already exists in this category');
          return;
        }
      }
  
      const newItem = {
        id: item ? item.id : Date.now().toString(),
        name: itemName,
        maxAmount: numericMaxAmount,
        image: image || null,
        categoryName,
        orgId: activeOrgId,
      };
  
      categories = categories.map(cat => {
        if (cat.name === categoryName) {
          let items = cat.items || [];
          if (item) {
            items = items.map(i => i.id === item.id ? newItem : i);
          } else {
            items.push(newItem);
          }
          return { ...cat, items };
        }
        return cat;
      });
  
      await AsyncStorage.setItem(storageKey, JSON.stringify(categories));
  
      Alert.alert('Success', item ? 'Item updated successfully' : 'Item added successfully');
      navigation.navigate('ManageCategoryItems', { categoryName, orgId: activeOrgId, refresh: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
      console.error(error);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        {item ? 'Edit Item' : 'Add New Item'}
      </Text>

      <TextInput
        style={{ borderColor: theme.colors.border, borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10, backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text }}
        placeholder="Item Name"
        placeholderTextColor={theme.colors.onSurface}
        value={itemName}
        onChangeText={setItemName}
      />

      <TextInput
        style={{ borderColor: theme.colors.border, borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10, backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text }}
        placeholder="Max Amount"
        placeholderTextColor={theme.colors.onSurface}
        value={maxAmount}
        onChangeText={setMaxAmount}
        keyboardType="numeric"
      />

      <TouchableOpacity style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10 }} onPress={pickImage}>
        <Text style={{ color: theme.colors.onPrimary }}>
          {image ? 'Change Image' : 'Pick Image'}
        </Text>
      </TouchableOpacity>

      {image && (
        <Image source={{ uri: image }} style={{ width: 150, height: 150, borderRadius: 10, alignSelf: 'center', marginBottom: 20, backgroundColor: '#ccc' }} />
      )}

      <TouchableOpacity style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, alignItems: 'center' }} onPress={handleSaveItem}>
        <Text style={{ color: theme.colors.onPrimary }}>
          {item ? 'Save Changes' : 'Add Item'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ItemEditorScreen;