import React, { useContext, useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Switch, 
  FlatList 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';

const ItemEditorScreen = ({ route, navigation }) => {
  const { categoryName, item } = route.params || {}; // Possibly editing an existing item
  const { theme } = useContext(ThemeContext);

  // ------------------------------
  // Single-item mode state/logic
  // ------------------------------
  const [itemName, setItemName] = useState(item ? item.name : '');
  const [maxAmount, setMaxAmount] = useState(item ? item.maxAmount?.toString() : '');
  const [image, setImage] = useState(item ? item.image : null);

  // Single: pick image from gallery
  const pickImageFromGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Single: pick image from camera
  const pickImageFromCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // Single: show options for picking
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

  // Single: save or update the item
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
      const storedItems = await AsyncStorage.getItem(`items_${activeOrgId}`);
      const allItems = storedItems ? JSON.parse(storedItems) : [];

      const newItem = {
        id: item ? item.id : Date.now().toString(),
        name: itemName,
        maxAmount: parseInt(maxAmount, 10) || 0,
        image: image || null,
        categoryName: categoryName,
        orgId: activeOrgId,
      };

      let updatedItems;
      if (item) {
        // Editing existing item
        updatedItems = allItems.map((i) => (i.id === item.id ? newItem : i));
      } else {
        // Adding new item
        updatedItems = [...allItems, newItem];
      }
      
      await AsyncStorage.setItem(`items_${activeOrgId}`, JSON.stringify(updatedItems));

      // 🛠 Also update the category's item list in AsyncStorage
      const storedCategories = await AsyncStorage.getItem(`categories_${activeOrgId}`);
      let categories = storedCategories ? JSON.parse(storedCategories) : [];
      
      // Find the category and update its items
      const categoryIndex = categories.findIndex(cat => cat.name === categoryName);
      if (categoryIndex !== -1) {
        categories[categoryIndex].items = updatedItems.filter(i => i.categoryName === categoryName);
        await AsyncStorage.setItem(`categories_${activeOrgId}`, JSON.stringify(categories));
      }

      Alert.alert('Success', item ? 'Item updated successfully' : 'Item added successfully');
      navigation.navigate('CategoryDetail', { categoryName, orgId: activeOrgId, refresh: true });
    } catch (error) {
      Alert.alert('Error', 'Failed to save item');
      console.error(error);
    }
};


  // ------------------------------------
  // Multiple-items mode state/logic
  // ------------------------------------
  const [multipleMode, setMultipleMode] = useState(false);
  const [multiItems, setMultiItems] = useState([]); 
  // Each entry in multiItems: { id, name, maxAmount, image }

  // Multi: pick from gallery or camera
  const pickImageForMultiple = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: handleMultiCamera },
        { text: 'Gallery', onPress: handleMultiGallery },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const handleMultiGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      addMultiItem(result.assets[0].uri);
    }
  };

  const handleMultiCamera = async () => {
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      addMultiItem(result.assets[0].uri);
    }
  };

  // Add a new blank item with a chosen image
  const addMultiItem = (imgUri) => {
    const newEntry = {
      id: Date.now().toString(),
      name: '',
      maxAmount: '',
      image: imgUri,
    };
    setMultiItems((prev) => [...prev, newEntry]);
  };

  // Save all multi items to AsyncStorage
  const handleSaveAllMultiItems = async () => {
    if (multiItems.length === 0) {
      Alert.alert('No Items', 'Please add at least one item.');
      return;
    }
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }
      // Retrieve existing items
      const storedItems = await AsyncStorage.getItem('items');
      let allItems = storedItems ? JSON.parse(storedItems) : [];

      // Convert multiItems to the same shape as single items
      const newEntries = multiItems.map((mi) => ({
        id: mi.id,
        name: mi.name || 'Unnamed Item',
        maxAmount: parseInt(mi.maxAmount, 10) || 0,
        image: mi.image,
        categoryName: categoryName,
        orgId: activeOrgId,
      }));
      // Merge with existing items
      allItems = [...allItems, ...newEntries];
      await AsyncStorage.setItem('items', JSON.stringify(allItems));

      Alert.alert('Success', 'All items have been saved!');
      navigation.navigate('CategoryDetail', { categoryName, orgId: activeOrgId, refresh: true });
    } catch (error) {
      console.error('Error saving multiple items:', error);
      Alert.alert('Error', 'Failed to save multiple items');
    }
  };

  // Render a single multi-item row
  const renderMultiItem = ({ item, index }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceVariant,
        borderRadius: 8,
        marginBottom: 10,
        padding: 10,
      }}
    >
      {/* Preview image */}
      <Image
        source={{ uri: item.image }}
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          backgroundColor: '#fff',
          marginRight: 10,
        }}
      />
      {/* Name / Max Amount inputs */}
      <View style={{ flex: 1 }}>
        <TextInput
          placeholder="Name"
          placeholderTextColor={theme.colors.onSurface}
          value={item.name}
          onChangeText={(val) => {
            const updated = [...multiItems];
            updated[index].name = val;
            setMultiItems(updated);
          }}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: 5,
            padding: 8,
            marginBottom: 5,
            color: theme.colors.text,
          }}
        />
        <TextInput
          placeholder="Max Amount"
          placeholderTextColor={theme.colors.onSurface}
          keyboardType="numeric"
          value={item.maxAmount}
          onChangeText={(val) => {
            const updated = [...multiItems];
            updated[index].maxAmount = val;
            setMultiItems(updated);
          }}
          style={{
            borderWidth: 1,
            borderColor: theme.colors.outline,
            borderRadius: 5,
            padding: 8,
            color: theme.colors.text,
          }}
        />
      </View>
    </View>
  );

  // If multipleMode is true, show the multi-items UI
  if (multipleMode) {
    return (
      <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
        {/* Switch row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: theme.colors.text, fontSize: 16, marginRight: 10 }}>
            Upload Multiple Items
          </Text>
          <Switch
            trackColor={{ false: '#767577', true: theme.colors.primary }}
            thumbColor={multipleMode ? '#f5dd4b' : '#f4f3f4'}
            onValueChange={(val) => setMultipleMode(val)}
            value={multipleMode}
          />
        </View>

        {/* Button to pick a new image/item */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            marginBottom: 20,
          }}
          onPress={pickImageForMultiple}
        >
          <Text style={{ color: theme.colors.onPrimary }}>Add New Image</Text>
        </TouchableOpacity>

        {/* List of multi-items */}
        <FlatList
          data={multiItems}
          keyExtractor={(item) => item.id}
          renderItem={renderMultiItem}
          style={{ marginBottom: 20 }}
        />

        {/* Button to save all multi-items */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
          }}
          onPress={handleSaveAllMultiItems}
        >
          <Text style={{ color: theme.colors.onPrimary }}>Save All Items</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Otherwise, show the single-item UI
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      {/* Switch row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16, marginRight: 10 }}>
          Upload Multiple Items
        </Text>
        <Switch
          trackColor={{ false: '#767577', true: theme.colors.primary }}
          thumbColor={multipleMode ? '#f5dd4b' : '#f4f3f4'}
          onValueChange={(val) => setMultipleMode(val)}
          value={multipleMode}
        />
      </View>

      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        {item ? 'Edit Item' : 'Add New Item'}
      </Text>

      {/* Single: item name input */}
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
        placeholderTextColor={theme.colors.onSurface}
        value={itemName}
        onChangeText={setItemName}
      />

      {/* Single: max amount input */}
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
        placeholderTextColor={theme.colors.onSurface}
        value={maxAmount}
        onChangeText={setMaxAmount}
        keyboardType="numeric"
      />

      {/* Single: pick/change image */}
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
        <Text style={{ color: theme.colors.onPrimary }}>
          {image ? 'Change Image' : 'Pick Image'}
        </Text>
      </TouchableOpacity>

      {/* Single: display chosen image */}
      {image && (
        <Image
          source={{ uri: image }}
          style={{
            width: 150,
            height: 150,
            borderRadius: 10,
            alignSelf: 'center',
            marginBottom: 20,
            backgroundColor: '#ccc',
          }}
        />
      )}

      {/* Single: save button */}
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
        }}
        onPress={handleSaveItem}
      >
        <Text style={{ color: theme.colors.onPrimary }}>
          {item ? 'Save Changes' : 'Add Item'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ItemEditorScreen;
