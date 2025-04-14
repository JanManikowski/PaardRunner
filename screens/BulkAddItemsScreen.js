// MultiItemEditorScreen.js
import React, { useContext, useState } from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const MultiItemEditorScreen = ({ route, navigation }) => {
  const { categoryName } = route.params;
  const { theme } = useContext(ThemeContext);

  // Each item in state: { id, image, name, maxAmount }
  const [items, setItems] = useState([]);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true, // Requires an expo-image-picker version that supports multiple selection
    });
    if (!result.canceled) {
      // result.assets is an array when multiple selection is enabled
      const selectedImages = result.assets;
      const newItems = selectedImages.map(asset => ({
        id: Date.now().toString() + Math.random().toString(), // generate a unique id
        image: asset.uri,
        name: '',
        maxAmount: '',
      }));
      setItems(prevItems => [...prevItems, ...newItems]);
    }
  };

  const handleSaveItems = async () => {
    // Validate each item
    for (const item of items) {
      if (item.name.trim() === '') {
        Alert.alert('Error', 'All items must have a name.');
        return;
      }
      const numericMaxAmount = parseInt(item.maxAmount, 10);
      if (isNaN(numericMaxAmount) || numericMaxAmount <= 0) {
        Alert.alert('Error', 'All items must have a valid max amount greater than 0.');
        return;
      }
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
      const categoryIndex = categories.findIndex(cat => cat.name === categoryName);
      if (categoryIndex === -1) {
        Alert.alert('Error', 'Category not found');
        return;
      }
      // Map items to proper structure
      const newItems = items.map(item => ({
        id: item.id,
        name: item.name,
        maxAmount: parseInt(item.maxAmount, 10),
        image: item.image,
        categoryName,
        orgId: activeOrgId,
      }));
      categories[categoryIndex].items = categories[categoryIndex].items
        ? [...categories[categoryIndex].items, ...newItems]
        : newItems;
      await AsyncStorage.setItem(storageKey, JSON.stringify(categories));
      Alert.alert('Success', 'Items added successfully');
      navigation.navigate('ManageCategoryItems', { categoryName, refresh: true });
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save items');
    }
  };

  // Render each item row with its image and input fields for name and maxAmount
  const renderItem = (item, index) => (
    <View key={item.id} style={{ marginBottom: 20, borderWidth: 1, borderColor: theme.colors.border, borderRadius: 5, padding: 10 }}>
      <Image
        source={{ uri: item.image }}
        style={{ width: 100, height: 100, borderRadius: 5, marginBottom: 10, alignSelf: 'center' }}
      />
      <TextInput
        style={{ borderColor: theme.colors.border, borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10, backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text }}
        placeholder="Item Name"
        placeholderTextColor={theme.colors.onSurface}
        value={item.name}
        onChangeText={(text) => {
          const newItems = [...items];
          newItems[index].name = text;
          setItems(newItems);
        }}
      />
      <TextInput
        style={{ borderColor: theme.colors.border, borderWidth: 1, padding: 10, borderRadius: 5, marginBottom: 10, backgroundColor: theme.colors.surfaceVariant, color: theme.colors.text }}
        placeholder="Max Amount"
        placeholderTextColor={theme.colors.onSurface}
        value={item.maxAmount}
        onChangeText={(text) => {
          const newItems = [...items];
          newItems[index].maxAmount = text;
          setItems(newItems);
        }}
        keyboardType="numeric"
      />
      <TouchableOpacity
        style={{ backgroundColor: theme.colors.error, padding: 10, borderRadius: 5, alignItems: 'center' }}
        onPress={() => {
          const newItems = items.filter((_, i) => i !== index);
          setItems(newItems);
        }}
      >
        <Text style={{ color: theme.colors.onError }}>Remove Item</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        Add Multiple Items
      </Text>
      <TouchableOpacity
        style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, alignItems: 'center', marginBottom: 20 }}
        onPress={pickImages}
      >
        <Text style={{ color: theme.colors.onPrimary }}>Pick Multiple Images</Text>
      </TouchableOpacity>
      {items.map((item, index) => renderItem(item, index))}
      {items.length > 0 && (
        <TouchableOpacity
          style={{ backgroundColor: theme.colors.primary, padding: 10, borderRadius: 5, alignItems: 'center', marginTop: 20 }}
          onPress={handleSaveItems}
        >
          <Text style={{ color: theme.colors.onPrimary }}>Save Items</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
};

export default MultiItemEditorScreen;
