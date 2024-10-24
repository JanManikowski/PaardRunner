import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const ItemEditorScreen = ({ route, navigation }) => {
  const { categoryName, item } = route.params || {}; // Get categoryName and item if passed (item is optional for adding)
  const { theme } = useContext(ThemeContext);

  const [itemName, setItemName] = useState(item ? item.name : ''); // Pre-populate if editing
  const [maxAmount, setMaxAmount] = useState(item ? item.maxAmount.toString() : '');
  const [image, setImage] = useState(item ? item.image : null); // Pre-populate image if editing

  // Handle image picking from gallery
  const pickImageFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1], // Set aspect ratio to 1:1 for square image
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); // Set image to the selected file
    }
  };

  // Handle image picking from camera
  const pickImageFromCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1], // Set aspect ratio to 1:1 for square image
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri); // Set image to the captured file
    }
  };

  // Show options to either take a picture or choose from gallery
  const pickImage = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: pickImageFromCamera },
        { text: 'Gallery', onPress: pickImageFromGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleSaveItem = async () => {
    if (itemName.trim() === '') {
      Alert.alert('Error', 'Item name is required');
      return;
    }
  
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }
  
      const storedItems = await AsyncStorage.getItem('items');
      const allItems = storedItems ? JSON.parse(storedItems) : [];
  
      const newItem = {
        id: item ? item.id : Date.now().toString(),
        name: itemName,
        maxAmount: parseInt(maxAmount, 10),
        image: image || null,
        categoryName: categoryName,  // Attach categoryName
        orgId: activeOrgId,          // Attach organization ID
      };
  
      let updatedItems;
      if (item) {
        updatedItems = allItems.map(i => (i.id === item.id ? newItem : i));
      } else {
        updatedItems = [...allItems, newItem];
      }
  
      await AsyncStorage.setItem('items', JSON.stringify(updatedItems));
      Alert.alert('Success', item ? 'Item updated successfully' : 'Item added successfully');
  
      // Navigate back to the CategoryDetail screen and pass orgId and categoryName
      navigation.navigate('CategoryDetail', { categoryName, orgId: activeOrgId, refresh: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
      console.error(error);
    }
  };
  
  
  

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        {item ? `Edit Item` : `Add New Item`}
      </Text>

      {/* Item Name Input */}
      <TextInput
        style={{
          borderColor: theme.colors.border,
          borderWidth: 1,
          padding: 10,
          borderRadius: 5,
          marginBottom: 10,
          backgroundColor: theme.colors.surfaceVariant,
          color: theme.colors.text,
        }}
        placeholder="Item Name"
        value={itemName}
        onChangeText={setItemName}
      />

      {/* Max Amount Input */}
      <TextInput
        style={{
          borderColor: theme.colors.border,
          borderWidth: 1,
          padding: 10,
          borderRadius: 5,
          marginBottom: 10,
          backgroundColor: theme.colors.surfaceVariant,
          color: theme.colors.text,
        }}
        placeholder="Max Amount"
        value={maxAmount}
        onChangeText={setMaxAmount}
        keyboardType="numeric"
      />

      {/* Pick Image Button */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginBottom: 10,
        }}
        onPress={pickImage}
      >
        <Text style={{ color: theme.colors.onPrimary }}>{image ? 'Change Image' : 'Pick Image'}</Text>
      </TouchableOpacity>

      {/* Display Selected Image */}
      {image && (
        <Image
          source={{ uri: image }}
          style={{
            width: 150,
            height: 150,
            borderRadius: 10,
            alignSelf: 'center',
            marginBottom: 20,
            backgroundColor: '#ccc', // Fallback background color for preview
          }}
        />
      )}

      {/* Save Button */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
        }}
        onPress={handleSaveItem}
      >
        <Text style={{ color: theme.colors.onPrimary }}>{item ? 'Save Changes' : 'Add Item'}</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ItemEditorScreen;
