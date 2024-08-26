import React, { useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, Button, ScrollView, Alert, TouchableOpacity, TextInput, BackHandler, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData, saveData, removeData } from '../storage/AsyncStorageHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const MissingItemsScreen = ({ route }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves, saveBarFridges, saveBarShelves, strongLiquor } = useContext(FridgeContext);
  const [missingItems, setMissingItems] = useState({
    fridgeItems: [],
    shelfItems: [],
    liquorItems: []
  });
  const [inputValues, setInputValues] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation();
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const backAction = () => {
      if (isEditing) {
        Alert.alert(
          'Finish Editing',
          'Please finish editing before navigating back.',
          [{ text: 'OK', onPress: () => {} }],
          { cancelable: false }
        );
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    const beforeRemoveListener = navigation.addListener('beforeRemove', (e) => {
      if (!isEditing) {
        return;
      }
      e.preventDefault();
      Alert.alert(
        'Finish Editing',
        'Please finish editing before leaving this screen.',
        [{ text: 'OK', onPress: () => {} }],
        { cancelable: false }
      );
    });

    return () => {
      backHandler.remove();
      beforeRemoveListener();
    };
  }, [isEditing, navigation]);

  const fetchMissingItems = async () => {
    let fridgeItems = [];
    let shelfItems = [];
    let liquorItems = [];

    // Fetch missing items from fridges
    if (barFridges[bar.name]) {
      const fridges = await Promise.all(
        barFridges[bar.name].map(async (fridge, index) => {
          const savedMissing = await getData(`fridge_${bar.name}_${index}`);
          return { ...fridge, missing: savedMissing !== null ? savedMissing : fridge.missing };
        })
      );
      fridges.forEach((item, fridgeIndex) => {
        if (item.missing > 0) {
          fridgeItems.push({ ...item, bar: bar.name, fridgeIndex });
        }
      });
    }

    // Fetch missing items from shelves
    if (barShelves[bar.name]) {
      const shelves = await Promise.all(
        barShelves[bar.name].map(async (shelf, index) => {
          const savedMissing = await getData(`shelf_${bar.name}_${index}`);
          return { ...shelf, missing: savedMissing !== null ? savedMissing : shelf.missing };
        })
      );
      shelves.forEach((item, shelfIndex) => {
        if (item.missing > 0) {
          shelfItems.push({ ...item, bar: bar.name, shelfIndex });
        }
      });
    }

    // Fetch missing strong liquor items
    const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
    const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
    strongLiquor.forEach((liquor) => {
      if (liquorCounts[liquor] > 0) {
        liquorItems.push({ type: liquor, missing: liquorCounts[liquor] });
      }
    });

    setMissingItems({ fridgeItems, shelfItems, liquorItems });
  };

  useFocusEffect(
    useCallback(() => {
      fetchMissingItems();
    }, [bar.name])
  );

  const generateMissingItemsMessage = () => {
    const header = `*${bar.name}is missing these items:*\n\n`;
  
    const generateCategoryList = (items, category) => {
      if (items.length === 0) return '';
      
      const list = items
        .map(item => `- ${item.type.padEnd(20, ' ')}: ${String(item.missing).padStart(3, ' ')}`)
        .join('\n');
      
      return `*${category}:*\n\`\`\`\n${list}\n\`\`\`\n`;
    };
  
    const fridgeList = generateCategoryList(missingItems.fridgeItems, 'Fridge Items');
    const shelfList = generateCategoryList(missingItems.shelfItems, 'Shelf Items');
    const liquorList = generateCategoryList(missingItems.liquorItems, 'Strong Liquor Items');
  
    return `${header}${fridgeList}${shelfList}${liquorList}`;
  };
  

  const copyToClipboard = () => {
    const message = generateMissingItemsMessage();
    Clipboard.setString(message);
    alert('Copied to clipboard!');
  };

  const shareList = async () => {
    const message = generateMissingItemsMessage();
    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const removeItem = async (item, index, category) => {
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove ${item.type}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: async () => {
            if (item.shelfIndex !== undefined) {
              await removeData(`shelf_${bar.name}_${item.shelfIndex}`);
              const updatedShelves = [...missingItems.shelfItems];
              updatedShelves.splice(index, 1);
              setMissingItems({ ...missingItems, shelfItems: updatedShelves });
              saveBarShelves(updatedShelves);
            } else if (item.fridgeIndex !== undefined) {
              await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
              const updatedFridges = [...missingItems.fridgeItems];
              updatedFridges.splice(index, 1);
              setMissingItems({ ...missingItems, fridgeItems: updatedFridges });
              saveBarFridges(updatedFridges);
            } else {
              // Handle removing liquor counts
              const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
              const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
              liquorCounts[item.type] = 0;
              await AsyncStorage.setItem('liquorCounts', JSON.stringify(liquorCounts));
              const updatedLiquorItems = [...missingItems.liquorItems];
              updatedLiquorItems.splice(index, 1);
              setMissingItems({ ...missingItems, liquorItems: updatedLiquorItems });
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const removeAllItems = () => {
    Alert.alert(
      "Remove All Items",
      `Are you sure you want to remove all items for ${bar.name}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove All",
          onPress: async () => {
            // Update both fridges, shelves, and liquor
            let updatedFridges = [...missingItems.fridgeItems];
            let updatedShelves = [...missingItems.shelfItems];
            let updatedLiquors = [...missingItems.liquorItems];
  
            for (let item of [...updatedFridges, ...updatedShelves, ...updatedLiquors]) {
              if (item.shelfIndex !== undefined) {
                await removeData(`shelf_${bar.name}_${item.shelfIndex}`);
              } else if (item.fridgeIndex !== undefined) {
                await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
              } else {
                // Handle removing liquor counts
                const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
                const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
                liquorCounts[item.type] = 0;
                await AsyncStorage.setItem('liquorCounts', JSON.stringify(liquorCounts));
              }
            }
  
            // Update context with the cleared data
            setMissingItems({ fridgeItems: [], shelfItems: [], liquorItems: [] });
          },
          style: "destructive"
        }
      ]
    );
  };

  const removeCategoryItems = (category, categoryTitle) => {
    Alert.alert(
      `Remove All ${categoryTitle}`,
      `Are you sure you want to remove all ${categoryTitle.toLowerCase()}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove All",
          onPress: async () => {
            if (category === 'fridgeItems') {
              const updatedFridges = [];
              for (const item of missingItems.fridgeItems) {
                await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
              }
              setMissingItems(prev => ({ ...prev, fridgeItems: updatedFridges }));
              saveBarFridges(updatedFridges);
            } else if (category === 'shelfItems') {
              const updatedShelves = [];
              for (const item of missingItems.shelfItems) {
                await removeData(`shelf_${bar.name}_${item.shelfIndex}`);
              }
              setMissingItems(prev => ({ ...prev, shelfItems: updatedShelves }));
              saveBarShelves(updatedShelves);
            } else if (category === 'liquorItems') {
              const updatedLiquorItems = [];
              const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
              const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
              for (const item of missingItems.liquorItems) {
                liquorCounts[item.type] = 0;
              }
              await AsyncStorage.setItem('liquorCounts', JSON.stringify(liquorCounts));
              setMissingItems(prev => ({ ...prev, liquorItems: updatedLiquorItems }));
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleInputChange = (index, value, category) => {
    const updatedCategoryItems = [...missingItems[category]];
    updatedCategoryItems[index].missing = value;
    setInputValues(prev => ({ ...prev, [`${category}-${index}`]: value }));
    setIsEditing(true);
  };

  const handleInputBlur = async (item, index, category) => {
    const newCount = parseInt(inputValues[`${category}-${index}`], 10);
    if (!isNaN(newCount)) {
      await updateMissingCount(item, index, newCount, category);
    }
    setIsEditing(false);
  };

  const updateMissingCount = async (item, index, newCount, category) => {
    if (category === 'shelfItems') {
      const updatedShelves = [...missingItems.shelfItems];
      updatedShelves[index].missing = newCount;
      setMissingItems(prev => ({ ...prev, shelfItems: updatedShelves }));
      await saveData(`shelf_${bar.name}_${item.shelfIndex}`, newCount);
      saveBarShelves(updatedShelves);
    } else if (category === 'fridgeItems') {
      const updatedFridges = [...missingItems.fridgeItems];
      updatedFridges[index].missing = newCount;
      setMissingItems(prev => ({ ...prev, fridgeItems: updatedFridges }));
      await saveData(`fridge_${bar.name}_${item.fridgeIndex}`, newCount);
      saveBarFridges(updatedFridges);
    } else if (category === 'liquorItems') {
      const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
      const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
      liquorCounts[item.type] = newCount;
      await AsyncStorage.setItem('liquorCounts', JSON.stringify(liquorCounts));
      const updatedLiquorItems = [...missingItems.liquorItems];
      updatedLiquorItems[index].missing = newCount;
      setMissingItems(prev => ({ ...prev, liquorItems: updatedLiquorItems }));
    }
  };

  return (
    <View style={{
      padding: 16,
      backgroundColor: theme.colors.background,
      flex: 1,
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: theme.colors.onBackground,
      }}>
        Missing Items for {bar.name}
      </Text>
      <ScrollView style={{
        backgroundColor: theme.colors.surfaceVariant,
        padding: 15,
        borderRadius: 8,
        shadowColor: theme.colors.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 20,
      }}>
        {/* Fridge Items */}
        {missingItems.fridgeItems.length > 0 && (
          <>
            <TouchableOpacity onPress={() => removeCategoryItems('fridgeItems', 'Fridge Items')}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: theme.colors.primary }}>
                Fridge Items
              </Text>
            </TouchableOpacity>
            {missingItems.fridgeItems.map((item, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <TouchableOpacity onPress={() => removeItem(item, index, 'fridgeItems')} style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                  }}>
                    {item.type}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 5,
                    width: 50,
                    textAlign: 'center',
                    color: theme.colors.text,
                  }}
                  value={inputValues[`fridgeItems-${index}`] !== undefined ? inputValues[`fridgeItems-${index}`] : String(item.missing)}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange(index, text, 'fridgeItems')}
                  onBlur={() => handleInputBlur(item, index, 'fridgeItems')}
                  onFocus={() => setIsEditing(true)}
                />
              </View>
            ))}
          </>
        )}

        {/* Shelf Items */}
        {missingItems.shelfItems.length > 0 && (
          <>
            <TouchableOpacity onPress={() => removeCategoryItems('shelfItems', 'Shelf Items')}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: theme.colors.secondary }}>
                Shelf Items
              </Text>
            </TouchableOpacity>
            {missingItems.shelfItems.map((item, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <TouchableOpacity onPress={() => removeItem(item, index, 'shelfItems')} style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                  }}>
                    {item.type}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 5,
                    width: 50,
                    textAlign: 'center',
                    color: theme.colors.text,
                  }}
                  value={inputValues[`shelfItems-${index}`] !== undefined ? inputValues[`shelfItems-${index}`] : String(item.missing)}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange(index, text, 'shelfItems')}
                  onBlur={() => handleInputBlur(item, index, 'shelfItems')}
                  onFocus={() => setIsEditing(true)}
                />
              </View>
            ))}
          </>
        )}

        {/* Strong Liquor Items */}
        {missingItems.liquorItems.length > 0 && (
          <>
            <TouchableOpacity onPress={() => removeCategoryItems('liquorItems', 'Strong Liquor Items')}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: theme.colors.error }}>
                Strong Liquor Items
              </Text>
            </TouchableOpacity>
            {missingItems.liquorItems.map((item, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <TouchableOpacity onPress={() => removeItem(item, index, 'liquorItems')} style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                  }}>
                    {item.type}
                  </Text>
                </TouchableOpacity>
                <TextInput
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: 5,
                    width: 50,
                    textAlign: 'center',
                    color: theme.colors.text,
                  }}
                  value={inputValues[`liquorItems-${index}`] !== undefined ? inputValues[`liquorItems-${index}`] : String(item.missing)}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange(index, text, 'liquorItems')}
                  onBlur={() => handleInputBlur(item, index, 'liquorItems')}
                  onFocus={() => setIsEditing(true)}
                />
              </View>
            ))}
          </>
        )}
      </ScrollView>
      <View style={{
        marginBottom: 10,
      }}>
        <Button title="Copy to Clipboard" onPress={copyToClipboard} color="#007BFF" />
      </View>
      <View style={{
        marginBottom: 10,
      }}>
        <Button title="Share List" onPress={shareList} color="#4CAF50" />
      </View>
      <View style={{
        marginBottom: 10,
      }}>
        <Button title="Remove All Items" onPress={removeAllItems} color="#FF3B30" />
      </View>
    </View>
  );
};


export default MissingItemsScreen;
