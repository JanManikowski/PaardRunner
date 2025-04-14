import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ThemeContext } from '../contexts/ThemeContext';

const ItemManagerScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [manageMode, setManageMode] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch categories from AsyncStorage for the active organization.
  const fetchCategories = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
      const allCategories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      // Filter by organization in case there are multiple
      setCategories(allCategories.filter(cat => cat.orgId === activeOrgId));
    } catch (error) {
      console.error('Failed to load categories', error);
      setCategories([]);
    }
  };

  // Save the reordered categories back to AsyncStorage.
  const saveCategoriesToStorage = async (updatedCategories) => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) return;
      await AsyncStorage.setItem(`categories_${activeOrgId}`, JSON.stringify(updatedCategories));
    } catch (error) {
      console.error('Failed to save category order', error);
    }
  };

  // Update local state and storage when the user drags a category.
  const handleCategoryDragEnd = async ({ data }) => {
    setCategories(data);
    await saveCategoriesToStorage(data);
  };

  // Add a new category into AsyncStorage.
  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') return;

    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
      const allCategories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      const newCategory = { name: newCategoryName, orgId: activeOrgId };

      // Avoid duplicate category names.
      const categoryExists = allCategories.some(cat => cat.name === newCategoryName && cat.orgId === activeOrgId);
      if (categoryExists) {
        Alert.alert('Error', 'Category already exists.');
        return;
      }
      const updatedCategories = [...allCategories, newCategory];
      await AsyncStorage.setItem(`categories_${activeOrgId}`, JSON.stringify(updatedCategories));
      setNewCategoryName('');
      setModalVisible(false);
      fetchCategories();
    } catch (error) {
      console.error('Failed to add category', error);
      Alert.alert('Error', 'Failed to add category.');
    }
  };

  // Delete a category by its name.
  const deleteCategory = async (categoryName) => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) return;
      const updatedCategories = categories.filter(cat => cat.name !== categoryName);
      await AsyncStorage.setItem(`categories_${activeOrgId}`, JSON.stringify(updatedCategories));
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Failed to delete category', error);
      Alert.alert('Error', 'Failed to delete category.');
    }
  };

  // Render a single category item for the draggable list.
  const renderCategoryItem = ({ item, index, drag, isActive }) => (
    <TouchableOpacity
      onLongPress={drag}
      onPress={() =>
        !manageMode && navigation.navigate('ManageCategoryItems', { categoryName: item.name })
      }
      style={{
        borderRadius: 10,
        marginVertical: 5,
        backgroundColor: isActive ? theme.colors.primary : theme.colors.surfaceVariant,
        shadowColor: theme.colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
        padding: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
      }}
    >
      <Text style={{ fontSize: 18, color: theme.colors.text }}>{item.name}</Text>
      {manageMode && (
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.error,
            padding: 5,
            borderRadius: 5,
          }}
          onPress={() => deleteCategory(item.name)}
        >
          <Text style={{ color: theme.colors.onError }}>Delete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        Item Manager
      </Text>

      <TouchableOpacity
        style={{
          padding: 10,
          backgroundColor: theme.colors.primary,
          borderRadius: 5,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
        onPress={() => setModalVisible(true)}
      >
        <Text style={{ color: theme.colors.onPrimary }}>Add New Category</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <Text style={{ flex: 1, fontSize: 24, fontWeight: 'bold', color: theme.colors.text }}>
          Categories:
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: manageMode ? theme.colors.error : theme.colors.primary,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 5,
          }}
          onPress={() => setManageMode(!manageMode)}
        >
          <Text style={{ color: manageMode ? theme.colors.onError : theme.colors.onPrimary }}>
            {manageMode ? 'Done' : 'Manage'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal for adding a new category */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: '80%', backgroundColor: theme.colors.surface, padding: 20, borderRadius: 10 }}>
            <TextInput
              style={{
                borderColor: theme.colors.border,
                borderWidth: 1,
                padding: 10,
                borderRadius: 5,
                marginBottom: 20,
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
              }}
              placeholder="Enter category name"
              placeholderTextColor={theme.colors.onSurface}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
            />
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: theme.colors.primary, borderRadius: 5, alignItems: 'center' }}
              onPress={handleAddCategory}
            >
              <Text style={{ color: theme.colors.onPrimary }}>Add Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{ padding: 10, backgroundColor: theme.colors.error, borderRadius: 5, alignItems: 'center', marginTop: 10 }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: theme.colors.onError }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Draggable list for categories */}
      <DraggableFlatList
        data={categories}
        keyExtractor={(item) => item.name}
        renderItem={renderCategoryItem}
        onDragEnd={handleCategoryDragEnd}
      />
    </View>
  );
};

export default ItemManagerScreen;
