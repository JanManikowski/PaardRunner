import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Modal } from 'react-native';
import { CategoryContext } from '../contexts/CategoryContext';  // Import your context
import { ThemeContext } from '../contexts/ThemeContext';       // Import your theme context

const ItemManagerScreen = ({ navigation }) => {
  const { categories, addCategory, deleteCategory } = useContext(CategoryContext);  // Use CategoryContext
  const { theme } = useContext(ThemeContext);  // Use ThemeContext for styling
  const [newCategoryName, setNewCategoryName] = useState('');  // State for new category input
  const [modalVisible, setModalVisible] = useState(false);  // State for modal visibility

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName);  // Add category through context
      setNewCategoryName('');  // Clear input after adding
      setModalVisible(false);  // Close the modal
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

      {/* Modal for Adding New Category */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
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
              value={newCategoryName}
              onChangeText={setNewCategoryName}  // Update state on text change
            />
            <TouchableOpacity
              style={{
                padding: 10,
                backgroundColor: theme.colors.primary,
                borderRadius: 5,
                alignItems: 'center',
              }}
              onPress={handleAddCategory}  // Add new category on press
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
              onPress={() => setModalVisible(false)}  // Close modal
            >
              <Text style={{ color: theme.colors.onError }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* List of Categories */}
      <ScrollView>
        {Object.keys(categories).map(categoryName => (
          <TouchableOpacity
            key={categoryName}
            onPress={() => navigation.navigate('CategoryDetail', { categoryName })}  // Navigate to CategoryDetailScreen
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
            <Text style={{ fontSize: 18, color: theme.colors.text }}>{categoryName}</Text>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.error,
                padding: 5,
                borderRadius: 5,
              }}
              onPress={() => deleteCategory(categoryName)}  // Delete category on press
            >
              <Text style={{ color: theme.colors.onError }}>Delete</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default ItemManagerScreen;
