import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { CategoryContext } from '../contexts/CategoryContext';
import Toast from 'react-native-toast-message';  // Import Toast for feedback

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { theme } = useContext(ThemeContext);
  const { categories } = useContext(CategoryContext);
  const [customItem, setCustomItem] = useState('');  // State for custom item input

  const handleAddCustomItem = () => {
    if (customItem.trim()) {
      // Add logic for adding the custom item
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: `${customItem} has been added`,
        position: 'top',
      });
      setCustomItem('');  // Clear the input field after adding the item
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid item name.',
        position: 'top',
      });
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.colors.text }}>
        {bar.name} Inventory
      </Text>

      <ScrollView>
        {/* Custom Categories */}
        {Object.keys(categories).map((categoryName) => (
          <TouchableOpacity
            key={categoryName}
            style={{
              padding: 20,
              borderRadius: 8,
              marginBottom: 10,
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('CategoryList', { categoryName, bar })}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
              View {categoryName}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Strong Liquor */}
        <TouchableOpacity
          style={{
            padding: 20,
            borderRadius: 8,
            marginBottom: 10,
            backgroundColor: theme.colors.surfaceVariant,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('StrongLiquorList', { bar })}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
            View Strong Liquor
          </Text>
        </TouchableOpacity>

        {/* View Missing Items */}
        <TouchableOpacity
          style={{
            padding: 20,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            marginBottom: 20,
            elevation: 2,
            alignItems: 'center',
            backgroundColor: theme.colors.surfaceVariant,
          }}
          onPress={() => navigation.navigate('MissingItems', { bar })}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
            View Missing Items
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} /> 

        {/* Custom Item Input */}
        <TextInput
          style={{
            padding: 10,
            borderColor: theme.colors.outline,
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 20,
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceVariant,
          }}
          placeholder="Enter custom item name"
          placeholderTextColor={theme.colors.onSurface}
          value={customItem}
          onChangeText={setCustomItem}
          onSubmitEditing={handleAddCustomItem}  // Automatically add the item when Enter is pressed
        />

        {/* Add Custom Item Button */}
        <TouchableOpacity
          style={{
            backgroundColor: theme.colors.primary,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
            width: '100%',
            alignItems: 'center',
            marginBottom: 20,
          }}
          onPress={handleAddCustomItem}
        >
          <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
            Add Custom Item
          </Text>
        </TouchableOpacity>

        {/* Toast Notifications */}
        <Toast ref={(ref) => Toast.setRef(ref)} />
      </ScrollView>
    </View>
  );
};

export default BarDetailScreen;
