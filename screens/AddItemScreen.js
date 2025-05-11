import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

const ItemEditorScreen = ({ route, navigation }) => {
  const { categoryName, item } = route.params || {};
  const { theme } = useContext(ThemeContext);

  const [itemName, setItemName] = useState(item?.name || '');
  const [maxAmount, setMaxAmount] = useState(
    item?.maxAmount?.toString() || ''
  );
  const [image, setImage] = useState(item?.image || null);

  // Pick from gallery
  const pickFromLibrary = async () => {
    const { status } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert(
        'Permission denied',
        'Need permission to access your photos.'
      );
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await saveLocal(uri);
    }
  };

  // Take a new photo
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      return Alert.alert(
        'Permission denied',
        'Need camera permission to take photo.'
      );
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) {
      const uri = result.assets[0].uri;
      await saveLocal(uri);
    }
  };

  // Copy into app storage and update state
  const saveLocal = async uri => {
    const name = uri.split('/').pop();
    const dest = FileSystem.documentDirectory + name;
    try {
      await FileSystem.copyAsync({ from: uri, to: dest });
      setImage(dest);
    } catch (e) {
      console.error('Failed to save image:', e);
    }
  };

  const handleSaveItem = async () => {
    if (!itemName.trim()) {
      return Alert.alert('Error', 'Item name is required');
    }
    const num = parseInt(maxAmount, 10);
    if (isNaN(num) || num <= 0) {
      return Alert.alert('Error', 'Max amount must be > 0');
    }
    try {
      const orgId = await AsyncStorage.getItem('activeOrgId');
      if (!orgId) {
        return Alert.alert('Error', 'No active organization');
      }
      const key = `categories_${orgId}`;
      const stored = await AsyncStorage.getItem(key);
      const cats = stored ? JSON.parse(stored) : [];

      const newItem = {
        id: item?.id || Date.now().toString(),
        name: itemName,
        maxAmount: num,
        image: image || null,
        categoryName,
        orgId,
      };

      const updatedCats = cats.map(cat => {
        if (cat.name !== categoryName) return cat;
        const items = cat.items || [];
        let newList;
        if (item) {
          newList = items.map(i => (i.id === item.id ? newItem : i));
        } else {
          newList = [...items, newItem];
        }
        return { ...cat, items: newList };
      });

      await AsyncStorage.setItem(key, JSON.stringify(updatedCats));
      Alert.alert('Success', item ? 'Updated!' : 'Added!');
      navigation.navigate('ManageCategoryItems', {
        categoryName,
        refresh: true,
      });
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Save failed');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          color: theme.colors.text,
        }}
      >
        {item ? 'Edit Item' : 'Add New Item'}
      </Text>

      <TextInput
        value={itemName}
        onChangeText={setItemName}
        placeholder="Item Name"
        placeholderTextColor={theme.colors.onSurface}
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 5,
          padding: 10,
          marginBottom: 10,
          backgroundColor: theme.colors.surfaceVariant,
          color: theme.colors.text,
        }}
      />

      <TextInput
        value={maxAmount}
        onChangeText={setMaxAmount}
        placeholder="Max Amount"
        placeholderTextColor={theme.colors.onSurface}
        keyboardType="numeric"
        style={{
          borderWidth: 1,
          borderColor: theme.colors.border,
          borderRadius: 5,
          padding: 10,
          marginBottom: 20,
          backgroundColor: theme.colors.surfaceVariant,
          color: theme.colors.text,
        }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <TouchableOpacity
          onPress={pickFromLibrary}
          style={{
            flex: 1,
            backgroundColor: theme.colors.primary,
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            marginRight: 5,
          }}
        >
          <Text style={{ color: theme.colors.onPrimary }}>Pick Image</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={takePhoto}
          style={{
            flex: 1,
            backgroundColor: theme.colors.primary,
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            marginLeft: 5,
          }}
        >
          <Text style={{ color: theme.colors.onPrimary }}>Take Photo</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <Image
          source={{ uri: image }}
          style={{
            width: 150,
            height: 150,
            borderRadius: 10,
            backgroundColor: '#ccc',
            alignSelf: 'center',
            marginBottom: 20,
          }}
          resizeMode="cover"
        />
      )}

      <TouchableOpacity
        onPress={handleSaveItem}
        style={{
          backgroundColor: theme.colors.primary,
          padding: 12,
          borderRadius: 5,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          {item ? 'Save Changes' : 'Add Item'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ItemEditorScreen;
