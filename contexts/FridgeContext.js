// FridgeContext.js
import React, { createContext, useState, useEffect } from 'react';
import { getData, saveData } from '../storage/AsyncStorageHelper';

export const FridgeContext = createContext();

export const FridgeProvider = ({ children }) => {
  const [barFridges, setBarFridges] = useState({});

  useEffect(() => {
    const loadBarFridges = async () => {
      try {
        const storedBarFridges = await getData('barFridges');
        if (storedBarFridges) {
          setBarFridges(storedBarFridges);
        }
      } catch (error) {
        console.error('Error loading bar fridges from local storage:', error);
      }
    };

    loadBarFridges();
  }, []);

  const saveBarFridges = async (updatedBarFridges) => {
    try {
      await saveData('barFridges', updatedBarFridges);
      setBarFridges(updatedBarFridges);
    } catch (error) {
      console.error('Error saving bar fridges to local storage:', error);
    }
  };

  return (
    <FridgeContext.Provider value={{ barFridges, setBarFridges, saveBarFridges }}>
      {children}
    </FridgeContext.Provider>
  );
};
