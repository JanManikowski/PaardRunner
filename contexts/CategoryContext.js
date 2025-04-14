import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  // Set the selected organization and load its categories
  const setOrganization = async (organization) => {
    try {
      await AsyncStorage.setItem('selectedOrganization', JSON.stringify(organization));
      setSelectedOrganization(organization);
      console.log(`Current organization: ${organization.name}`);
      const storedCategories = await AsyncStorage.getItem(`categories_${organization.id}`);
      setCategories(storedCategories ? JSON.parse(storedCategories) : []);
    } catch (error) {
      console.error('Error setting selected organization:', error);
    }
  };

  // Get the selected organization
  const getOrganization = async () => {
    try {
      const storedOrganization = await AsyncStorage.getItem('selectedOrganization');
      const organization = storedOrganization ? JSON.parse(storedOrganization) : null;
      setSelectedOrganization(organization);
      console.log(`Loaded organization: ${organization ? organization.name : 'No organization selected'}`);
      return organization;
    } catch (error) {
      console.error('Error getting selected organization:', error);
      return null;
    }
  };

  // Save categories array to AsyncStorage and update state
  const saveCategories = async (newCategories) => {
    if (!selectedOrganization) return;
    try {
      await AsyncStorage.setItem(`categories_${selectedOrganization.id}`, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  // Add a new category (if not already present)
  const addCategory = async (categoryName) => {
    if (categories.some(cat => cat.name === categoryName)) {
      console.log(`Category "${categoryName}" already exists.`);
      return;
    }
    const newCategories = [
      ...categories,
      { name: categoryName, items: [], orgId: selectedOrganization.id }
    ];
    await saveCategories(newCategories);
  };

  const deleteCategory = async (categoryName) => {
    const newCategories = categories.filter(cat => cat.name !== categoryName);
    await saveCategories(newCategories);
  };

  const addItemToCategory = async (categoryName, item) => {
    const newCategories = categories.map(cat => {
      if (cat.name === categoryName) {
        return { ...cat, items: [...(cat.items || []), item] };
      }
      return cat;
    });
    await saveCategories(newCategories);
  };

  const removeItemFromCategory = async (categoryName, itemName) => {
    const newCategories = categories.map(cat => {
      if (cat.name === categoryName) {
        return { ...cat, items: (cat.items || []).filter(item => item.name !== itemName) };
      }
      return cat;
    });
    await saveCategories(newCategories);
  };

  const updateItemInCategory = async (categoryName, updatedItem) => {
    const newCategories = categories.map(cat => {
      if (cat.name === categoryName) {
        return {
          ...cat,
          items: (cat.items || []).map(item => item.name === updatedItem.name ? updatedItem : item)
        };
      }
      return cat;
    });
    await saveCategories(newCategories);
  };

  const updateCategoryItems = async (categoryName, updatedItems) => {
    const newCategories = categories.map(cat => {
      if (cat.name === categoryName) {
        return { ...cat, items: updatedItems };
      }
      return cat;
    });
    await saveCategories(newCategories);
  };

  // Directly set categories (for importing data, etc.)
  const setCategoriesDirectly = async (importedCategories) => {
    await saveCategories(importedCategories);
  };

  return (
    <CategoryContext.Provider value={{
      categories,
      selectedOrganization,
      setOrganization,
      getOrganization,
      setCategories: setCategoriesDirectly,
      addCategory,
      deleteCategory,
      addItemToCategory,
      removeItemFromCategory,
      updateItemInCategory,
      updateCategoryItems
    }}>
      {children}
    </CategoryContext.Provider>
  );
};

export default CategoryProvider;
