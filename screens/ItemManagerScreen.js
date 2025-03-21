import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  // Use the same key when fetching categories
  const fetchCategories = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
      // Always use the key "categories_${activeOrgId}"
      const allCategories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      setCategories(allCategories.filter((cat) => cat.orgId === activeOrgId));
    } catch (error) {
      console.error('Failed to load categories', error);
      setCategories([]);
    }
  };

  const handleAddCategory = async () => {
    if (newCategoryName.trim() === '') return;

    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
      // Use the same key here too
      const allCategories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      const newCategory = { name: newCategoryName, orgId: activeOrgId };

      // Check if category already exists
      const categoryExists = allCategories.some(
        (cat) => cat.name === newCategoryName && cat.orgId === activeOrgId
      );
      if (categoryExists) {
        console.log(`Category "${newCategoryName}" already exists for this organization.`);
        Alert.alert('Error', 'Category already exists.');
        return;
      }

      const updatedCategories = [...allCategories, newCategory];
      // Save using the same key
      await AsyncStorage.setItem(`categories_${activeOrgId}`, JSON.stringify(updatedCategories));

      setNewCategoryName('');
      setModalVisible(false);
      // Refresh the category list
      fetchCategories();
    } catch (error) {
      console.error('Failed to add category', error);
      Alert.alert('Error', 'Failed to add category.');
    }
  };

  const deleteCategory = async (categoryName) => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
      // Remove the category from the current state
      const updatedCategories = categories.filter((cat) => cat.name !== categoryName);

      // Update AsyncStorage using the same key
      await AsyncStorage.setItem(`categories_${activeOrgId}`, JSON.stringify(updatedCategories));
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Failed to delete category', error);
      Alert.alert('Error', 'Failed to delete category.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        Item Manager
      </Text>

      {/* Button to open Modal */}
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

      {/* Row with "Categories:" text and the Manage/Done button */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
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

      {/* Modal for Adding New Category */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
              style={{
                padding: 10,
                backgroundColor: theme.colors.primary,
                borderRadius: 5,
                alignItems: 'center',
              }}
              onPress={handleAddCategory}
            >
              <Text style={{ color: theme.colors.onPrimary }}>Add Category</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: 10,
                backgroundColor: theme.colors.error,
                borderRadius: 5,
                alignItems: 'center',
                marginTop: 10,
              }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: theme.colors.onError }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* List of Categories */}
      <ScrollView>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={index}
            onPress={() =>
              navigation.navigate('CategoryDetail', { categoryName: category.name })
            }
            style={{
              borderRadius: 10,
              marginVertical: 5,
              backgroundColor: theme.colors.surfaceVariant,
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
            <Text style={{ fontSize: 18, color: theme.colors.text }}>
              {category.name}
            </Text>
            {manageMode && (
              <TouchableOpacity
                style={{
                  backgroundColor: theme.colors.error,
                  padding: 5,
                  borderRadius: 5,
                }}
                onPress={() => deleteCategory(category.name)}
              >
                <Text style={{ color: theme.colors.onError }}>Delete</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ItemManagerScreen;
