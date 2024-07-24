import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import InventoryUpdateScreen from '../screens/InventoryUpdateScreen';

const Stack = createStackNavigator();

const BarStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="InventoryUpdate" component={InventoryUpdateScreen} />
    </Stack.Navigator>
  );
};

export default BarStackNavigator;
