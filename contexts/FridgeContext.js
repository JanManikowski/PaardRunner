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
    'Apple Juice': 2 * numShelves,
    'Orange Juice': 2 * numShelves,
    'Cassis': 2 * numShelves,
    'Bitter Lemon': 2 * numShelves,
    'White Wine': 4 * 2 * numShelves, // Assuming 2 rows of white wine
    'Rose': 4 * numShelves,
    'Sweet Wine': 4 * numShelves,
    'Ginger Beer': 4 * numShelves,
    'Ginger Ale': 4 * numShelves, 
  };
};

export const FridgeProvider = ({ children }) => {
  const [barFridges, setBarFridges] = useState({});
  const [barShelves, setBarShelves] = useState({});
  const [maxAmounts, setMaxAmounts] = useState({});
  const [barColors, setBarColors] = useState({});

  const [strongLiquor, setStrongLiquor] = useState([
    'Jack Daniels', 'Jameson', 'Southern Comfort', 'Vodka', 'Red Vodka',
    'Rum', 'Brown Rum', 'Bacardi Lemon', 'Bacardi Razz', 'Malibu', 'Gin'
  ]);

  useEffect(() => {
    const updateMaxAmounts = async () => {
      const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      const newMaxAmounts = {};
      storedBars.forEach(bar => {
        newMaxAmounts[bar.name] = calculateMaxAmounts(bar.numFridges, bar.numShelves);
      });
      setMaxAmounts(newMaxAmounts);
    };
    const fetchColors = async () => {
      const storedColors = JSON.parse(await AsyncStorage.getItem('barColors')) || {};
      setBarColors(storedColors);
    };
    fetchColors();
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

  const saveBarColors = async (colors) => {
    try {
      await AsyncStorage.setItem('barColors', JSON.stringify(colors));
      setBarColors(colors);
    } catch (error) {
      console.error('Error saving colors:', error);
    }
  };

  const addLiquor = (liquor) => {
    setStrongLiquor([...strongLiquor, liquor]);
  };

  const removeLiquor = (liquor) => {
    setStrongLiquor(strongLiquor.filter(item => item !== liquor));
  };

  return (
    <FridgeContext.Provider value={{
      barFridges, setBarFridges, saveBarFridges,
      barShelves, setBarShelves, saveBarShelves,
      maxAmounts, barColors, setBarColors, saveBarColors,
      strongLiquor, addLiquor, removeLiquor
    }}>
      {children}
    </FridgeContext.Provider>
  );
};
