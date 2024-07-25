// FridgeContext.js
import React, { createContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FridgeContext = createContext();

export const FridgeProvider = ({ children }) => {
  const [barFridges, setBarFridges] = useState({});
  const [barShelves, setBarShelves] = useState({});

  const saveBarFridges = async (fridges) => {
    try {
      await AsyncStorage.setItem('barFridges', JSON.stringify(fridges));
      setBarFridges(fridges);
    } catch (error) {
      console.error('Error saving fridges:', error);
    }
  };

  const saveBarShelves = async (shelves) => {
    try {
      await AsyncStorage.setItem('barShelves', JSON.stringify(shelves));
      setBarShelves(shelves);
    } catch (error) {
      console.error('Error saving shelves:', error);
    }
  };

  return (
    <FridgeContext.Provider value={{ barFridges, setBarFridges, saveBarFridges, barShelves, setBarShelves, saveBarShelves }}>
      {children}
    </FridgeContext.Provider>
  );
};
