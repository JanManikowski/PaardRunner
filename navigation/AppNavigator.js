import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AddBar from '../components/AddBar';
import ViewBars from '../components/ViewBars';
import BarDetailScreen from '../screens/BarDetailScreen';
import FridgeDetailScreen from '../screens/FridgeDetailScreen';
import ShelfDetailScreen from '../screens/ShelfDetailScreen';
import FridgeListScreen from '../screens/FridgeListScreen';
import ShelfListScreen from '../screens/ShelfListScreen';
import MissingItemsScreen from '../screens/MissingItemsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="AddBar" component={AddBar} />
      <Stack.Screen name="ViewBars" component={ViewBars} />
      <Stack.Screen name="BarDetail" component={BarDetailScreen} />
      <Stack.Screen name="FridgeDetail" component={FridgeDetailScreen} />
      <Stack.Screen name="ShelfDetail" component={ShelfDetailScreen} />
      <Stack.Screen name="FridgeList" component={FridgeListScreen} />
      <Stack.Screen name="ShelfList" component={ShelfListScreen} />
      <Stack.Screen name="MissingItems" component={MissingItemsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
