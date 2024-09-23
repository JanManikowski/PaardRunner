import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { CategoryContext } from '../contexts/CategoryContext';  // Import your context
import { ThemeContext } from '../contexts/ThemeContext';       // Import your theme context

const ItemManagerScreen = ({ navigation }) => {
  const { categories, addCategory, deleteCategory } = useContext(CategoryContext);  // Use CategoryContext
  const { theme } = useContext(ThemeContext);  // Use ThemeContext for styling
  const [newCategoryName, setNewCategoryName] = useState('');  // State for new category input

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCategory(newCategoryName);  // Add category through context
      setNewCategoryName('');  // Clear input after adding
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        Item Manager
      </Text>

      {/* Add New Category */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TextInput
          style={{
            flex: 1,
            borderColor: theme.colors.border,
            borderWidth: 1,
            padding: 10,
            borderRadius: 5,
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
            marginLeft: 10,
            borderRadius: 5,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={handleAddCategory}  // Add new category on press
        >
          <Text style={{ color: theme.colors.onPrimary }}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* List of Categories */}
      <ScrollView>
        {Object.keys(categories).map(categoryName => (
          <View key={categoryName} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate('CategoryDetail', { categoryName })}  // Navigate to CategoryDetailScreen
              style={{ flex: 1 }}
            >
              <Text style={{ fontSize: 18, color: theme.colors.text }}>{categoryName}</Text>
            </TouchableOpacity>
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
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default ItemManagerScreen;
