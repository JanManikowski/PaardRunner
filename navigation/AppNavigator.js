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
      </Stack.Navigator>
    </FridgeProvider>
  );
};

export default AppNavigator;
