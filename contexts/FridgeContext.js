// FridgeContext.js
import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const FridgeContext = createContext();

const calculateMaxAmounts = (numFridges, numShelves) => {
  return {
    'Spa Blauw': 7 * 5 * numFridges,
    'Grolsch 0.0': 3 * 6 * numFridges,
    'Grimbergen': 3 * 6 * numFridges,
    'Radler': 2 * 6 * numFridges,
    'Spa Rood': 4 * 6 * numFridges,
    'Weizen 0.0': 2 * 6 * numFridges,
    'Bok': 1 * 6 * numFridges,
    'IPA': 2 * 6 * numFridges,
    // Add similar calculations for shelves if needed
  };
};

export const FridgeProvider = ({ children }) => {
  const [barFridges, setBarFridges] = useState({});
  const [barShelves, setBarShelves] = useState({});
  const [maxAmounts, setMaxAmounts] = useState({});

  useEffect(() => {
    // Update max amounts whenever barFridges or barShelves change
    const updateMaxAmounts = async () => {
      const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      const newMaxAmounts = {};
      storedBars.forEach(bar => {
        newMaxAmounts[bar.name] = calculateMaxAmounts(bar.numFridges, bar.numShelves);
      });
      setMaxAmounts(newMaxAmounts);
    };

    updateMaxAmounts();
  }, [barFridges, barShelves]);

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
    <FridgeContext.Provider value={{ barFridges, setBarFridges, saveBarFridges, barShelves, setBarShelves, saveBarShelves, maxAmounts }}>
      {children}
    </FridgeContext.Provider>
  );
};
