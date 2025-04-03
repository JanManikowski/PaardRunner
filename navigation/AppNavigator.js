import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { FridgeProvider } from '../contexts/FridgeContext';
import { NativeBaseProvider } from 'native-base';

import BarListScreen from '../screens/BarListScreen';             // Was ViewBarsScreen
import ManageBarsScreen from '../screens/ManageBarsScreen';
import AddBarScreen from '../screens/AddBarScreen';
import BarCategoriesScreen from '../screens/BarCategoriesScreen';     // Was BarDetailScreen
import BarMissingItemsScreen from '../screens/BarMissingItemsScreen'; // Was MissingItemsScreen
import SettingsScreen from '../screens/SettingsScreen';
import ManageCategoriesScreen from '../screens/ManageCategoriesScreen'; // Was ItemManagerScreen
import ManageCategoryItemsScreen from '../screens/ManageCategoryItemsScreen'; // Was CategoryDetailScreen
import ManageMissingAmountScreen from '../screens/ManageMissingAmountScreen'; // Was ItemDetailScreen
import CategoryInventoryListScreen from '../screens/CategoryInventoryListScreen'; // Was CategoryListScreen
import AddItemScreen from '../screens/AddItemScreen';             // Was ItemEditorScreen
import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/AdminDashboard';
import CustomCratesScreen from '../screens/CustomCrateScreen'; // Assuming file is CustomCrateScreen.js
import RecommendedCratesScreen from '../screens/RecommendedCratesScreen';
import AllMissingItemsScreen from '../screens/AllMissingItemsScreen';   // Was NewAllMissingItemsScreen
import BulkAddItemsScreen from '../screens/BulkAddItemsScreen';       // Was MultiItemEditorScreen

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <NativeBaseProvider>
      <FridgeProvider>
        <Stack.Navigator initialRouteName="BarList">
          <Stack.Screen name="BarList" component={BarListScreen} />
          <Stack.Screen name="ManageBars" component={ManageBarsScreen} />
          <Stack.Screen name="AddBar" component={AddBarScreen} />
          <Stack.Screen name="BarCategories" component={BarCategoriesScreen} />
          <Stack.Screen name="BarMissingItems" component={BarMissingItemsScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="ManageCategories" component={ManageCategoriesScreen} />
          <Stack.Screen name="ManageCategoryItems" component={ManageCategoryItemsScreen} />
          <Stack.Screen name="ManageMissingAmount" component={ManageMissingAmountScreen} />
          <Stack.Screen name="CategoryInventoryList" component={CategoryInventoryListScreen} />
          <Stack.Screen name="AddItem" component={AddItemScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
          <Stack.Screen name="CustomCrates" component={CustomCratesScreen} />
          <Stack.Screen name="RecommendedCrates" component={RecommendedCratesScreen} />
          <Stack.Screen name="AllMissingItems" component={AllMissingItemsScreen} />
          <Stack.Screen name="BulkAddItems" component={BulkAddItemsScreen} />
        </Stack.Navigator>
      </FridgeProvider>
    </NativeBaseProvider>
  );
};

export default AppNavigator;

// Your logLocalStorageData function remains the same
// Make sure AsyncStorage is imported if you keep this function here.
// Consider moving utility functions like this to a separate file (e.g., utils.js)
export const logLocalStorageData = async () => {
  try {
    // --- Requires AsyncStorage import ---
    // import AsyncStorage from '@react-native-async-storage/async-storage';

    const bars = await AsyncStorage.getItem('bars');
    const categories = await AsyncStorage.getItem('categories');
    const items = await AsyncStorage.getItem('items');

    const parsedBars = bars ? JSON.parse(bars) : [];
    const parsedCategories = categories ? JSON.parse(categories) : {};
    const parsedItems = items ? JSON.parse(items) : [];

    console.log('--- Local Storage Data ---'); // Added header for clarity
    console.log('Bars:');
    if (parsedBars.length > 0) {
        parsedBars.forEach((bar, index) => {
          console.log(` Bar ${index + 1}:`);
          console.log(`   Name: ${bar.name}`);
          console.log(`   Color: ${bar.color}`);
          console.log(`   Number of Fridges: ${bar.numFridges}`);
          console.log(`   Number of Shelves: ${bar.numShelves}`);
          console.log(`   Last Opened: ${bar.lastOpened}`);
          // Log bar-specific inventory if needed/available
        });
    } else {
        console.log(' No bars found.');
    }


    console.log('Categories (Templates):'); // Clarified this likely refers to templates
     if (Object.keys(parsedCategories).length > 0) {
        Object.keys(parsedCategories).forEach((categoryName) => {
          console.log(` Category: ${categoryName}`);
          parsedCategories[categoryName].forEach((item, index) => {
            console.log(`   Item ${index + 1}:`);
            console.log(`     Name: ${item.name}`);
            console.log(`     Max Amount: ${item.maxAmount}`);
            // Missing count here might be irrelevant for a template, depends on your data structure
            console.log(`     Missing: ${item.missing ?? 'N/A'}`);
            console.log(`     Image: ${item.image}`);
          });
        });
     } else {
         console.log(' No category templates found.');
     }


    console.log('Items (Master List?):'); // Clarified potential purpose
    if (parsedItems.length > 0) {
      parsedItems.forEach((item, index) => {
        console.log(` Item ${index + 1}:`);
        console.log(`   Name: ${item.name}`);
        console.log(`   Max Amount: ${item.maxAmount}`);
      });
    } else {
      console.log(' No master items found.');
    }
     console.log('--- End Local Storage Data ---'); // Added footer

  } catch (error) {
    console.error('Error logging local storage data:', error);
  }
};