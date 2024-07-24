import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FridgeContext = createContext();

export const FridgeProvider = ({ children }) => {
  const [fridges, setFridges] = useState([]);

  useEffect(() => {
    const loadFridges = async () => {
      try {
        const storedFridges = await AsyncStorage.getItem('fridges');
        if (storedFridges) {
          setFridges(JSON.parse(storedFridges));
        }
      } catch (error) {
        console.error('Error loading fridges from local storage:', error);
      }
    };

    loadFridges();
  }, []);

  const saveFridges = async (updatedFridges) => {
    try {
      await AsyncStorage.setItem('fridges', JSON.stringify(updatedFridges));
      setFridges(updatedFridges);
    } catch (error) {
      console.error('Error saving fridges to local storage:', error);
    }
  };

  return (
    <FridgeContext.Provider value={{ fridges, setFridges, saveFridges }}>
      {children}
    </FridgeContext.Provider>
  );
};
