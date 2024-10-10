import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import ViewBarsScreen from '../screens/ViewBarsScreen'; 
import ManageBarsScreen from '../screens/ManageBarsScreen'; 
import AddBarScreen from '../screens/AddBarScreen';
import BarDetailScreen from '../screens/BarDetailScreen';
import FridgeDetailScreen from '../screens/FridgeDetailScreen';
import ShelfDetailScreen from '../screens/ShelfDetailScreen';
import FridgeListScreen from '../screens/FridgeListScreen';
import ShelfListScreen from '../screens/ShelfListScreen';
import MissingItemsScreen from '../screens/MissingItemsScreen';
import { FridgeProvider } from '../contexts/FridgeContext';
import CaseOpeningScreen from '../screens/CaseOpeningScreen';
import StrongLiquorListScreen from '../screens/StrongLiquorListScreen';
import RecommendedCratesScreen from '../screens/RecommendedCratesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ItemManagerScreen from '../screens/ItemManagerScreen';
import CategoryDetailScreen from '../screens/CategoryDetailScreen';
import ItemDetailScreen from '../screens/ItemDetailScreen';
import CategoryListScreen from '../screens/CategoryListScreen';
import ItemEditorScreen from '../screens/ItemEditorScreen';
import LoginScreen from '../screens/LoginScreen';
import AdminFeaturesScreen from '../screens/AdminFeaturesScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <FridgeProvider>
      <Stack.Navigator initialRouteName="ViewBars">
        <Stack.Screen name="ViewBars" component={ViewBarsScreen} />
        <Stack.Screen name="ManageBars" component={ManageBarsScreen} />
        <Stack.Screen name="AddBar" component={AddBarScreen} />
        <Stack.Screen name="BarDetail" component={BarDetailScreen} />
        <Stack.Screen name="FridgeDetail" component={FridgeDetailScreen} />
        <Stack.Screen name="ShelfDetail" component={ShelfDetailScreen} />
        <Stack.Screen name="FridgeList" component={FridgeListScreen} />
        <Stack.Screen name="ShelfList" component={ShelfListScreen} />
        <Stack.Screen name="MissingItems" component={MissingItemsScreen} />
        <Stack.Screen name="CaseOpening" component={CaseOpeningScreen} />
        <Stack.Screen name="StrongLiquorList" component={StrongLiquorListScreen} />
        <Stack.Screen name="RecommendedCrates" component={RecommendedCratesScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="ItemManager" component={ItemManagerScreen} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
        <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
        <Stack.Screen name="CategoryList" component={CategoryListScreen} />
        <Stack.Screen name="ItemEditor" component={ItemEditorScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="AdminFeatures" component={AdminFeaturesScreen} />
      </Stack.Navigator>
    </FridgeProvider>
  );
};

export default AppNavigator;

// Function to log local storage data (for debugging purposes)
export const logLocalStorageData = async () => {
  try {
    const bars = await AsyncStorage.getItem('bars');
    const categories = await AsyncStorage.getItem('categories');
    const items = await AsyncStorage.getItem('items');

    const parsedBars = bars ? JSON.parse(bars) : [];
    const parsedCategories = categories ? JSON.parse(categories) : {};
    const parsedItems = items ? JSON.parse(items) : [];

    console.log('Bars:');
    parsedBars.forEach((bar, index) => {
      console.log(`Bar ${index + 1}:`);
      console.log(`  Name: ${bar.name}`);
      console.log(`  Color: ${bar.color}`);
      console.log(`  Number of Fridges: ${bar.numFridges}`);
      console.log(`  Number of Shelves: ${bar.numShelves}`);
      console.log(`  Last Opened: ${bar.lastOpened}`);
    });

    console.log('Categories:');
    Object.keys(parsedCategories).forEach((categoryName) => {
      console.log(`Category: ${categoryName}`);
      parsedCategories[categoryName].forEach((item, index) => {
        console.log(`  Item ${index + 1}:`);
        console.log(`    Name: ${item.name}`);
        console.log(`    Max Amount: ${item.maxAmount}`);
        console.log(`    Missing: ${item.missing ?? 'N/A'}`);
        console.log(`    Image: ${item.image}`);
      });
    });

    console.log('Items:');
    if (parsedItems.length > 0) {
      parsedItems.forEach((item, index) => {
        console.log(`Item ${index + 1}:`);
        console.log(`  Name: ${item.name}`);
        console.log(`  Max Amount: ${item.maxAmount}`);
      });
    } else {
      console.log('No items found');
    }
  } catch (error) {
    console.error('Error logging local storage data:', error);
  }
};
