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
    '7up': 4 * numShelves,
    'Sisi': 4 * numShelves,
    'Icetea Green': 4 * numShelves,
    'Tonic': 4 * numShelves,
    'Apple juice': 2 * numShelves,
    'Orange juice': 2 * numShelves,
    'Cassis': 2 * numShelves,
    'Bitter lemon': 2 * numShelves,
    'White wine': 4 * 2 * numShelves, // Assuming 2 rows of white wine
    'Rose': 4 * numShelves,
    'Sweet wine': 4 * numShelves,
    'Ginger beer': 4 * numShelves,
    'Ginger ale': 4, // Fixed to 4 as per description
  };
};

export const FridgeProvider = ({ children }) => {
  const [barFridges, setBarFridges] = useState({});
  const [barShelves, setBarShelves] = useState({});
  const [maxAmounts, setMaxAmounts] = useState({});

  useEffect(() => {
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
