import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native';
import { CategoryContext } from '../contexts/CategoryContext';  // Use CategoryContext
import { ThemeContext } from '../contexts/ThemeContext';        // Use ThemeContext
import * as ImagePicker from 'expo-image-picker';  // To handle image uploads

const ItemEditorScreen = ({ route, navigation }) => {
  const { categoryName, item } = route.params || {};  // Get categoryName and item if passed (item is optional for adding)
  const { addItemToCategory, updateItemInCategory } = useContext(CategoryContext);
  const { theme } = useContext(ThemeContext);

  const [itemName, setItemName] = useState(item ? item.name : '');  // Pre-populate if editing
  const [maxAmount, setMaxAmount] = useState(item ? item.maxAmount.toString() : '');
  const [image, setImage] = useState(item ? item.image : null);  // Pre-populate image if editing

  // Handle image picking
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);  // Set image to the selected file
    }
  };

  const handleSaveItem = () => {
    const newItem = {
      name: itemName,
      maxAmount: parseInt(maxAmount, 10),
      image: image || null,  // Store the selected image or leave it null
    };

    if (item) {
      updateItemInCategory(categoryName, newItem);  // Edit existing item
    } else {
      addItemToCategory(categoryName, newItem);  // Add new item
    }

    navigation.goBack();  // Navigate back to the category detail
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
