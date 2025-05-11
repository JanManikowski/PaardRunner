import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { ThemeContext } from '../contexts/ThemeContext';

const ManageCategoriesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [manageMode, setManageMode] = useState(false);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState(null);
  const [editedCategoryName, setEditedCategoryName] = useState('');

  // load categories for this org
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) return;
      const all = JSON.parse(
        await AsyncStorage.getItem(`categories_${activeOrgId}`)
      ) || [];
      setCategories(all.filter(cat => cat.orgId === activeOrgId));
    } catch (e) {
      console.error(e);
    }
  };

  const saveCategories = async updated => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) return;
      await AsyncStorage.setItem(
        `categories_${activeOrgId}`,
        JSON.stringify(updated)
      );
      setCategories(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return Alert.alert('Error', 'Name cannot be empty.');
    if (categories.some(c => c.name === name)) {
      return Alert.alert('Error', 'Category already exists.');
    }
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) return;
      const newCat = { name, orgId: activeOrgId };
      const updated = [...categories, newCat];
      await AsyncStorage.setItem(
        `categories_${activeOrgId}`,
        JSON.stringify(updated)
      );
      setNewCategoryName('');
      setModalVisible(false);
      setCategories(updated);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add category.');
    }
  };

  const deleteCategory = async name => {
    try {
      const updated = categories.filter(c => c.name !== name);
      await saveCategories(updated);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to delete category.');
    }
  };

  const handleCategoryDragEnd = async ({ data }) => {
    await saveCategories(data);
  };

  const openEditModal = cat => {
    setCategoryToEdit(cat);
    setEditedCategoryName(cat.name);
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    const name = editedCategoryName.trim();
    if (!name) return Alert.alert('Error', 'Name cannot be empty.');
    if (
      categories.some(
        c => c.name === name && c.name !== categoryToEdit.name
      )
    ) {
      return Alert.alert('Error', 'Category already exists.');
    }
    try {
      const updated = categories.map(c =>
        c.name === categoryToEdit.name ? { ...c, name } : c
      );
      await saveCategories(updated);
      setEditModalVisible(false);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to rename category.');
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
        Manage Categories
      </Text>

      {/* Add Category Button */}
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={{
          padding: 10,
          backgroundColor: theme.colors.primary,
          borderRadius: 5,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: theme.colors.onPrimary }}>Add New Category</Text>
      </TouchableOpacity>

      {/* Manage Toggle */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.colors.text,
          }}
        >
          Categories:
        </Text>
        <TouchableOpacity
          onPress={() => setManageMode(!manageMode)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 8,
            backgroundColor: manageMode
              ? theme.colors.error
              : theme.colors.primary,
            borderRadius: 5,
          }}
        >
          <Text
            style={{
              color: manageMode
                ? theme.colors.onError
                : theme.colors.onPrimary,
            }}
          >
            {manageMode ? 'Done' : 'Manage'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Add Category Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
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
              placeholder="Enter category name"
              placeholderTextColor={theme.colors.onSurface}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              style={{
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 5,
                padding: 10,
                marginBottom: 20,
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
              }}
            />

            <TouchableOpacity
              onPress={handleAddCategory}
              style={{
                padding: 10,
                backgroundColor: theme.colors.primary,
                borderRadius: 5,
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Text style={{ color: theme.colors.onPrimary }}>Add</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={{
                padding: 10,
                backgroundColor: theme.colors.error,
                borderRadius: 5,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.colors.onError }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Edit Category Modal */}
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
              placeholder="Category name"
              placeholderTextColor={theme.colors.onSurface}
              value={editedCategoryName}
              onChangeText={setEditedCategoryName}
              style={{
                borderColor: theme.colors.border,
                borderWidth: 1,
                borderRadius: 5,
                padding: 10,
                marginBottom: 20,
                backgroundColor: theme.colors.surfaceVariant,
                color: theme.colors.text,
              }}
            />

            <TouchableOpacity
              onPress={handleSaveEdit}
              style={{
                padding: 10,
                backgroundColor: theme.colors.primary,
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
                padding: 10,
                backgroundColor: theme.colors.error,
                borderRadius: 5,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: theme.colors.onError }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Categories List */}
      <DraggableFlatList
        data={categories}
        keyExtractor={item => item.name}
        onDragEnd={handleCategoryDragEnd}
        renderItem={({ item, index, drag, isActive }) => (
          <TouchableOpacity
            onLongPress={drag}
            onPress={() =>
              !manageMode &&
              navigation.navigate('ManageCategoryItems', {
                categoryName: item.name,
              })
            }
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 10,
              marginVertical: 5,
              borderRadius: 10,
              backgroundColor: isActive
                ? theme.colors.primary
                : theme.colors.surfaceVariant,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
            }}
          >
            <Text style={{ fontSize: 18, color: theme.colors.text }}>
              {item.name}
            </Text>
            {manageMode && (
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  onPress={() => openEditModal(item)}
                  style={{
                    padding: 5,
                    backgroundColor: theme.colors.primary,
                    borderRadius: 5,
                    marginRight: 5,
                  }}
                >
                  <Text style={{ color: theme.colors.onPrimary }}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => deleteCategory(item.name)}
                  style={{
                    padding: 5,
                    backgroundColor: theme.colors.error,
                    borderRadius: 5,
                  }}
                >
                  <Text style={{ color: theme.colors.onError }}>Delete</Text>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

export default ManageCategoriesScreen;
