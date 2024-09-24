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
