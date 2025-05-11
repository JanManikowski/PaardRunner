import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ThemeContext } from '../contexts/ThemeContext';

const CategoryDetailScreen = ({ route, navigation }) => {
  const { categoryName } = route.params;
  const { theme } = useContext(ThemeContext);

  const [items, setItems] = useState([]);
  const [manageMode, setManageMode] = useState(false);
  const [activeOrgId, setActiveOrgId] = useState(null);

  // Modal state for editing an item
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [itemToEdit, setItemToEdit] = useState(null);
  const [editedName, setEditedName] = useState('');
  const [editedMax, setEditedMax] = useState('');
  const [editedImage, setEditedImage] = useState(null);

  // Load items when screen focuses
  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [categoryName])
  );

  const fetchItems = async () => {
    try {
      const orgId = await AsyncStorage.getItem('activeOrgId');
      setActiveOrgId(orgId);
      const stored =
        JSON.parse(await AsyncStorage.getItem(`categories_${orgId}`)) || [];
      const cat = stored.find(c => c.name === categoryName);
      setItems(cat?.items || []);
    } catch (e) {
      console.error('Failed to fetch items:', e);
    }
  };

  const saveItemsToStorage = async updatedItems => {
    try {
      const stored =
        JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      const updatedCats = stored.map(c =>
        c.name === categoryName ? { ...c, items: updatedItems } : c
      );
      await AsyncStorage.setItem(
        `categories_${activeOrgId}`,
        JSON.stringify(updatedCats)
      );
    } catch (e) {
      console.error('Failed to save items:', e);
    }
  };

  const handleDragEnd = async ({ data }) => {
    setItems(data);
    await saveItemsToStorage(data);
  };

  const removeItem = async itemName => {
    const updated = items.filter(i => i.name !== itemName);
    setItems(updated);
    await saveItemsToStorage(updated);
  };

  const openEditModal = item => {
    setItemToEdit(item);
    setEditedName(item.name);
    setEditedMax(item.maxAmount?.toString() || '');
    setEditedImage(item.image || null);
    setEditModalVisible(true);
  };

  // Pick image from library
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Permission to access your photos is required to pick an image.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditedImage(result.assets[0].uri);
    }
  };

  const handleSaveEdit = async () => {
    const name = editedName.trim();
    const max = parseInt(editedMax, 10);
    if (!name) {
      Alert.alert('Error', 'Name cannot be empty.');
      return;
    }
    if (isNaN(max) || max <= 0) {
      Alert.alert('Error', 'Max amount must be a positive number.');
      return;
    }

    const updated = items.map(i =>
      i.name === itemToEdit.name
        ? { ...i, name, maxAmount: max, image: editedImage }
        : i
    );
    setItems(updated);
    await saveItemsToStorage(updated);
    setEditModalVisible(false);
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 10,
          textAlign: 'center',
          color: theme.colors.text,
        }}
      >
        {categoryName} Items
      </Text>

      <TouchableOpacity
        style={{
          backgroundColor: manageMode ? theme.colors.error : theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={() => setManageMode(!manageMode)}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          {manageMode ? 'Done' : 'Manage Items'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginBottom: 10,
        }}
        onPress={() => navigation.navigate('AddItem', { categoryName })}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          Add New Item
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 10,
          borderRadius: 5,
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={() => navigation.navigate('BulkAddItems', { categoryName })}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          Add Multiple Items
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <DraggableFlatList
          data={items}
          keyExtractor={item => item.name}
          onDragEnd={handleDragEnd}
          renderItem={({ item, drag, isActive }) => (
            <TouchableOpacity
              onLongPress={drag}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 10,
                backgroundColor: isActive
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
                borderRadius: 8,
                padding: 10,
                shadowColor: theme.colors.shadow || '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Image
                source={
                  item.image
                    ? { uri: item.image }
                    : require('../assets/placeholder.jpg')
                }
                style={{
                  width: 50,
                  height: 50,
                  marginRight: 10,
                  borderRadius: 5,
                  backgroundColor: '#fff',
                }}
                resizeMode="cover"
                resizeMethod="resize"
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, color: theme.colors.text }}>
                  {item.name}
                </Text>
                <Text style={{ color: theme.colors.text }}>
                  Max: {item.maxAmount}
                </Text>
              </View>

              {manageMode && (
                <>  
                  <TouchableOpacity
                    onPress={() => removeItem(item.name)}
                    style={{
                      backgroundColor: theme.colors.error,
                      padding: 5,
                      borderRadius: 5,
                      marginLeft: 10,
                    }}
                  >
                    <Text style={{ color: theme.colors.onError }}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => openEditModal(item)}
                    style={{
                      backgroundColor: theme.colors.primary,
                      padding: 5,
                      borderRadius: 5,
                      marginLeft: 10,
                    }}
                  >
                    <Text style={{ color: theme.colors.onPrimary }}>Edit</Text>
                  </TouchableOpacity>
                </>
              )}
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Edit Item Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: '80%',
              backgroundColor: theme.colors.surface,
              padding: 20,
              borderRadius: 10,
            }}
          >
            <TextInput
              placeholder="Name"
              placeholderTextColor={theme.colors.onSurface}
              value={editedName}
              onChangeText={setEditedName}
              style={{
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 5,
                padding: 10,
                marginBottom: 10,
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
              }}
            />
            <TextInput
              placeholder="Max Amount"
              placeholderTextColor={theme.colors.onSurface}
              value={editedMax}
              onChangeText={setEditedMax}
              keyboardType="numeric"
              style={{
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 5,
                padding: 10,
                marginBottom: 10,
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
              }}
            />
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
                {editedImage ? 'Change Image' : 'Pick Image'}
              </Text>
            </TouchableOpacity>
            {editedImage && (
              <Image
                source={{ uri: editedImage }}
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
            <TouchableOpacity
              onPress={handleSaveEdit}
              style={{
                backgroundColor: theme.colors.primary,
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: theme.colors.onPrimary }}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={{
                backgroundColor: theme.colors.error,
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.colors.onError }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default CategoryDetailScreen;
