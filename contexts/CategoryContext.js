// CategoryContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Create the context
export const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState({});
  
  useEffect(() => {
    // Load categories from AsyncStorage on initialization
    const loadCategories = async () => {
      try {
        const storedCategories = await AsyncStorage.getItem('categories');
        setCategories(storedCategories ? JSON.parse(storedCategories) : {});
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    loadCategories();
  }, []);

  // Save categories to AsyncStorage
  const saveCategories = async (newCategories) => {
    try {
      await AsyncStorage.setItem('categories', JSON.stringify(newCategories));
      setCategories(newCategories);
    } catch (error) {
      console.error('Failed to save categories:', error);
    }
  };

  // Add a new category
  const addCategory = async (categoryName) => {
    const newCategories = { ...categories, [categoryName]: [] };
    await saveCategories(newCategories);
  };

  // Delete a category
  const deleteCategory = async (categoryName) => {
    const { [categoryName]: _, ...remainingCategories } = categories;  // Destructure to remove the category
    await saveCategories(remainingCategories);
  };

  // Add an item to a category
  const addItemToCategory = async (categoryName, item) => {
    const newCategories = { 
      ...categories, 
      [categoryName]: [...(categories[categoryName] || []), item] 
    };
    await saveCategories(newCategories);
  };

  // Remove an item from a category
  const removeItemFromCategory = async (categoryName, itemName) => {
    const updatedItems = (categories[categoryName] || []).filter(item => item.name !== itemName);
    const newCategories = { ...categories, [categoryName]: updatedItems };
    await saveCategories(newCategories);
  };

  // Update an item in a category
  const updateItemInCategory = async (categoryName, updatedItem) => {
    const updatedItems = (categories[categoryName] || []).map(item =>
      item.name === updatedItem.name ? updatedItem : item
    );
    const newCategories = { ...categories, [categoryName]: updatedItems };
    await saveCategories(newCategories);
  };

  return (
    <CategoryContext.Provider value={{
      categories,
      addCategory,
      deleteCategory,
      addItemToCategory,
      removeItemFromCategory,
      updateItemInCategory
    }}>
      {children}
    </CategoryContext.Provider>
  );
};
