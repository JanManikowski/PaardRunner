// CategoryContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState({});
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  // Function to log and set the selected organization
  const setOrganization = async (organization) => {
    try {
      await AsyncStorage.setItem('selectedOrganization', JSON.stringify(organization));
      setSelectedOrganization(organization);
      console.log(`Current organization: ${organization.name}`);
    } catch (error) {
      console.error('Error setting selected organization:', error);
    }
  };

  // Function to get the selected organization
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

  useEffect(() => {
    // Load the selected organization and categories from AsyncStorage on initialization
    const loadData = async () => {
      const organization = await getOrganization();
      if (organization) {
        const storedCategories = await AsyncStorage.getItem(`categories_${organization.id}`);
        setCategories(storedCategories ? JSON.parse(storedCategories) : {});
      }
    };
    loadData();
  }, []);

  // Save categories to AsyncStorage for the selected organization
  const saveCategories = async (newCategories) => {
    if (!selectedOrganization) return;

    try {
      await AsyncStorage.setItem(`categories_${selectedOrganization.id}`, JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  // Add a new category for the selected organization
  const addCategory = async (categoryName) => {
    const newCategories = { ...categories, [categoryName]: [] };
    await saveCategories(newCategories);
  };

  // Delete a category for the selected organization
  const deleteCategory = async (categoryName) => {
    const { [categoryName]: _, ...remainingCategories } = categories;
    await saveCategories(remainingCategories);
  };

  // Add an item to a category for the selected organization
  const addItemToCategory = async (categoryName, item) => {
    const newCategories = { 
      ...categories, 
      [categoryName]: [...(categories[categoryName] || []), item] 
    };
    await saveCategories(newCategories);
  };

  // Remove an item from a category for the selected organization
  const removeItemFromCategory = async (categoryName, itemName) => {
    const updatedItems = (categories[categoryName] || []).filter(item => item.name !== itemName);
    const newCategories = { ...categories, [categoryName]: updatedItems };
    await saveCategories(newCategories);
  };

  // Update an item in a category for the selected organization
  const updateItemInCategory = async (categoryName, updatedItem) => {
    const updatedItems = (categories[categoryName] || []).map(item =>
      item.name === updatedItem.name ? updatedItem : item
    );
    const newCategories = { ...categories, [categoryName]: updatedItems };
    await saveCategories(newCategories);
  };

  // Update the entire category items (useful for importing data)
  const updateCategoryItems = async (categoryName, updatedItems) => {
    const newCategories = { ...categories, [categoryName]: updatedItems };
    await saveCategories(newCategories);
  };

  // Set categories directly (used for importing data)
  const setCategoriesDirectly = async (importedCategories) => {
    await saveCategories(importedCategories);
  };

  return (
    <CategoryContext.Provider value={{
      categories,
      selectedOrganization,
      setOrganization,    // Added function to set the organization
      getOrganization,    // Added function to get the organization
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
