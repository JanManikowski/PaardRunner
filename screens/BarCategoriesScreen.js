import React, { useContext, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message'; // Import Toast for feedback
import { useFocusEffect } from '@react-navigation/native';

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { theme } = useContext(ThemeContext);
  const [categories, setCategories] = useState({});
  const [customItem, setCustomItem] = useState(''); // State for custom item input

  // Fetch categories linked to the active organization
  const fetchCategories = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }

      const allCategories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      const filteredCategories = allCategories.filter(category => category.orgId === activeOrgId);
      setCategories(filteredCategories);
    } catch (error) {
      console.error('Failed to load categories from storage', error);
    }
  };

  // Fetch categories whenever the screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCategories();
    }, [])
  );

  // Handle adding a custom item
  const handleAddCustomItem = async () => {
    if (customItem.trim()) {
      try {
        const activeOrgId = await AsyncStorage.getItem('activeOrgId');
        if (!activeOrgId) {
          Alert.alert('Error', 'No active organization selected');
          return;
        }
  
        // Create the custom item without a category
        const newItem = { 
          id: Date.now().toString(),
          name: customItem, 
          categoryName: null,  // <-- Explicitly set to null
          orgId: activeOrgId,
          maxAmount: 1,
          missing: 1,
          image: null,
        };
  
        // Store missing key explicitly for MissingItemsScreen to find it
        const missingKey = `missing_${newItem.id}_${activeOrgId}_${bar.name}`;
        await AsyncStorage.setItem(missingKey, '1');
  
        // Store the custom item separately in AsyncStorage (optional but recommended)
        const customItemsKey = `custom_missing_items_${activeOrgId}_${bar.name}`;
        const customItems = JSON.parse(await AsyncStorage.getItem(customItemsKey)) || [];
        customItems.push(newItem);
        await AsyncStorage.setItem(customItemsKey, JSON.stringify(customItems));
  
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `${customItem} has been added to Missing Items`,
          position: 'top',
        });
  
        setCustomItem('');
      } catch (error) {
        console.error('Failed to add custom item', error);
        Toast.show({ type: 'error', text1: 'Error', text2: 'Failed to add custom item.' });
      }
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter a valid item name.' });
    }
  };
  
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.colors.text }}>
        {bar.name} Inventory
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
      {categories.length > 0 ? (
  categories.map((category, index) => (
    <TouchableOpacity
      key={index}
      style={{
        padding: 20,
        borderRadius: 8,
        marginBottom: 10,
        backgroundColor: theme.colors.surfaceVariant,
        alignItems: 'center',
      }}
      // In BarDetailScreen
onPress={async () => {
  const orgId = await AsyncStorage.getItem('activeOrgId');
  const storedCategories = JSON.parse(await AsyncStorage.getItem(`categories_${orgId}`)) || [];
  const selectedCategory = storedCategories.find(c => c.name === category.name);

  const updatedItems = await Promise.all(
    (selectedCategory.items || []).map(async (item) => {
      const missingKey = `missing_${item.id}_${orgId}_${bar.name}`;
      const savedMissing = await AsyncStorage.getItem(missingKey);
      return {
        ...item,
        missing: savedMissing ? parseInt(savedMissing, 10) : 0,
      };
    })
  );
  

  navigation.navigate('CategoryInventoryList', {
    categoryName: category.name,
    bar,
    categories,
    preloadedItems: updatedItems, // <== Pass preloaded
  });
}}

    >
      <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
        View {category.name} {/* Display the correct category name */}
      </Text>
    </TouchableOpacity>
  ))
) : (
  <Text style={{ textAlign: 'center', color: theme.colors.text }}>No categories available.</Text>
)}


        <TouchableOpacity
          style={{
            padding: 20,
            borderRadius: 8,
            marginBottom: 20,
            alignItems: 'center',
            backgroundColor: theme.colors.surfaceVariant,
          }}
          onPress={() => navigation.navigate('BarMissingItems', { bar })}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
            View Missing Items
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Custom Item Input and Button */}
      <View style={{ paddingTop: 10, paddingBottom:20 }}>
        <TextInput
          style={{
            padding: 15,
            borderColor: theme.colors.outline,
            borderWidth: 1,
            borderRadius: 5,
            marginBottom: 10,
            color: theme.colors.text,
            backgroundColor: theme.colors.surfaceVariant,
          }}
          placeholder="Enter custom item name"
          placeholderTextColor={theme.colors.onSurface}
          value={customItem}
          onChangeText={setCustomItem}
        />

<TouchableOpacity
  style={{
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  }}
  onPress={handleAddCustomItem} // <-- no argument here anymore
>
          <Text style={{ color: theme.colors.onPrimary, fontWeight: 'bold' }}>
            Add Custom Item
          </Text>
        </TouchableOpacity>
      </View>

      <Toast ref={(ref) => Toast.setRef(ref)} />
    </View>
  );
};

export default BarDetailScreen;
