import React, { useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, Button, ScrollView, Alert, TouchableOpacity, TextInput, BackHandler, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData, saveData, removeData } from '../storage/AsyncStorageHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import RecommendedCratesScreen from './RecommendedCratesScreen';

const MissingItemsScreen = ({ route }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves, saveBarFridges, saveBarShelves, strongLiquor, addCustomMissingItem } = useContext(FridgeContext);
  const [missingItems, setMissingItems] = useState({
    fridgeItems: [],
    shelfItems: [],
    liquorItems: [],
    customItems: [] // New category for custom items
  });
  const [inputValues, setInputValues] = useState({}); 
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);

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
    let customItems = [];
  
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
  
    // Fetch custom missing items independently
    const storedCustomItems = JSON.parse(await AsyncStorage.getItem('customItems')) || {};
    customItems = storedCustomItems[bar.name] || [];
  
    setMissingItems({ fridgeItems, shelfItems, liquorItems, customItems });
  };

  useFocusEffect(
    useCallback(() => {
      fetchMissingItems();
    }, [bar.name])
  );

  const generateMissingItemsMessage = () => {
    const header = `*${bar.name} is missing these items:*\n\n`;

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
    const customList = generateCategoryList(missingItems.customItems, 'Custom Items'); // New custom items list

    return `${header}${fridgeList}${shelfList}${liquorList}${customList}`;
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
            let updatedItems = [...missingItems[category]];
            updatedItems.splice(index, 1); // Remove the item from the category array
            
            if (category === 'customItems') {
              const storedCustomItems = JSON.parse(await AsyncStorage.getItem('customItems')) || {};
              storedCustomItems[bar.name] = updatedItems;
              await AsyncStorage.setItem('customItems', JSON.stringify(storedCustomItems));
            } else if (category === 'shelfItems') {
              await removeData(`shelf_${bar.name}_${item.shelfIndex}`);
              saveBarShelves(updatedItems);
            } else if (category === 'fridgeItems') {
              await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
              saveBarFridges(updatedItems);
            } else if (category === 'liquorItems') {
              const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
              const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
              liquorCounts[item.type] = 0;
              await AsyncStorage.setItem('liquorCounts', JSON.stringify(liquorCounts));
            }
            
            // Update the missingItems state
            setMissingItems(prev => ({ ...prev, [category]: updatedItems }));
  
            // Update inputValues to remove the deleted item's input and shift the remaining ones
            const updatedInputValues = { ...inputValues };
            delete updatedInputValues[`${category}-${index}`];
            for (let i = index + 1; i <= updatedItems.length; i++) {
              updatedInputValues[`${category}-${i - 1}`] = updatedInputValues[`${category}-${i}`];
              delete updatedInputValues[`${category}-${i}`];
            }
            setInputValues(updatedInputValues);
          },
          style: "destructive"
        }
      ]
    );
  };
  

  const removeCategoryItems = (category, categoryName) => {
    Alert.alert(
      `Remove ${categoryName}`,
      `Are you sure you want to remove all items in ${categoryName}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Remove",
          onPress: async () => {
            if (category === 'customItems') {
              const storedCustomItems = JSON.parse(await AsyncStorage.getItem('customItems')) || {};
              storedCustomItems[bar.name] = [];
              await AsyncStorage.setItem('customItems', JSON.stringify(storedCustomItems));
              setMissingItems(prev => ({ ...prev, customItems: [] }));
            } else if (category === 'shelfItems') {
              await Promise.all(missingItems.shelfItems.map(async (item, index) => {
                await removeData(`shelf_${bar.name}_${item.shelfIndex}`);
              }));
              setMissingItems(prev => ({ ...prev, shelfItems: [] }));
              saveBarShelves([]);
            } else if (category === 'fridgeItems') {
              await Promise.all(missingItems.fridgeItems.map(async (item, index) => {
                await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
              }));
              setMissingItems(prev => ({ ...prev, fridgeItems: [] }));
              saveBarFridges([]);
            } else if (category === 'liquorItems') {
              const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
              const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
              missingItems.liquorItems.forEach(item => {
                liquorCounts[item.type] = 0;
              });
              await AsyncStorage.setItem('liquorCounts', JSON.stringify(liquorCounts));
              setMissingItems(prev => ({ ...prev, liquorItems: [] }));
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
                    // Remove fridge items from AsyncStorage
                    for (let item of missingItems.fridgeItems) {
                        await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
                    }

                    // Remove shelf items from AsyncStorage
                    for (let item of missingItems.shelfItems) {
                        await removeData(`shelf_${bar.name}_${item.shelfIndex}`);
                    }

                    // Remove liquor items from AsyncStorage
                    const storedLiquorCounts = await AsyncStorage.getItem('liquorCounts');
                    if (storedLiquorCounts) {
                        const liquorCounts = JSON.parse(storedLiquorCounts);
                        missingItems.liquorItems.forEach(item => {
                            liquorCounts[item.type] = 0;
                        });
                        await AsyncStorage.setItem('liquorCounts', JSON.stringify(liquorCounts));
                    }

                    // Remove custom items from AsyncStorage
                    const storedCustomItems = JSON.parse(await AsyncStorage.getItem('customItems')) || {};
                    storedCustomItems[bar.name] = [];
                    await AsyncStorage.setItem('customItems', JSON.stringify(storedCustomItems));

                    // Update context and state to reflect the removals
                    setMissingItems({ fridgeItems: [], shelfItems: [], liquorItems: [], customItems: [] });
                    saveBarFridges([]);
                    saveBarShelves([]);
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
  };

  const handleInputBlur = async (item, index, category) => {
    const newCount = parseInt(inputValues[`${category}-${index}`], 10);
  if (!isNaN(newCount)) {
    await updateMissingCount(item, index, newCount, category);
  }
  setIsEditing(false);
  };

  const updateMissingCount = async (item, index, newCount, category) => {
    if (category === 'customItems') {
      const storedFridges = JSON.parse(await AsyncStorage.getItem('barFridges')) || {};
      storedFridges[bar.name][item.customIndex].missing = newCount;
      await AsyncStorage.setItem('barFridges', JSON.stringify(storedFridges));
      const updatedCustomItems = [...missingItems.customItems];
      updatedCustomItems[index].missing = newCount;
      setMissingItems(prev => ({ ...prev, customItems: updatedCustomItems }));
      setBarFridges(storedFridges);
    } else if (category === 'shelfItems') {
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

  useFocusEffect(
    useCallback(() => {
      if (route.params?.refresh) {
        fetchMissingItems();
      }
    }, [route.params])
  );

  const incrementCount = async (index, category) => {
    const currentValue = parseInt(inputValues[`${category}-${index}`], 10) || missingItems[category][index].missing;
    const updatedValue = currentValue + 1;
    handleInputChange(index, String(updatedValue), category);
    await updateMissingCount(missingItems[category][index], index, updatedValue, category);
    setIsEditing(false); // Ensure editing state is not set during button click
  };
  
  const decrementCount = async (index, category) => {
    const currentValue = parseInt(inputValues[`${category}-${index}`], 10) || missingItems[category][index].missing;
    const updatedValue = currentValue > 0 ? currentValue - 1 : 0;
    handleInputChange(index, String(updatedValue), category);
    await updateMissingCount(missingItems[category][index], index, updatedValue, category);
    setIsEditing(false); // Ensure editing state is not set during button click
  };

  return (
    <View style={{
      padding: 16,
      backgroundColor: theme.colors.background,
      flex: 1,
      paddingBottom: -10
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
        
      }}
      contentContainerStyle={{ paddingBottom: 15 }}>
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
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity onPress={() => decrementCount(index, 'fridgeItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>-</Text>
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
                    onFocus={() => setIsEditing(true)} // Set editing state only when TextInput is focused
                  />
                  <TouchableOpacity onPress={() => incrementCount(index, 'fridgeItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>+</Text>
                  </TouchableOpacity>
                </View>
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
                <TouchableOpacity onPress={() => decrementCount(index, 'shelfItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>-</Text>
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
                <TouchableOpacity onPress={() => incrementCount(index, 'shelfItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>+</Text>
                  </TouchableOpacity>
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
                <TouchableOpacity onPress={() => decrementCount(index, 'liquorItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>-</Text>
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
                <TouchableOpacity onPress={() => incrementCount(index, 'liquorItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>+</Text>
                  </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* Custom Items */}
        {missingItems.customItems.length > 0 && (
          <>
            <TouchableOpacity onPress={() => removeCategoryItems('customItems', 'Custom Items')}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: theme.colors.tertiary }}>
                Custom Items
              </Text>
            </TouchableOpacity>
            {missingItems.customItems.map((item, index) => (
              <View key={index} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <TouchableOpacity onPress={() => removeItem(item, index, 'customItems')} style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                  }}>
                    {item.type}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => decrementCount(index, 'customItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>-</Text>
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
                  value={inputValues[`customItems-${index}`] !== undefined ? inputValues[`customItems-${index}`] : String(item.missing)}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange(index, text, 'customItems')}
                  onBlur={() => handleInputBlur(item, index, 'customItems')}
                  onFocus={() => setIsEditing(true)}
                />
                <TouchableOpacity onPress={() => incrementCount(index, 'customItems')}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>+</Text>
                  </TouchableOpacity>
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <View style={{
          marginBottom: 10,
        }}>
        <Button title="Show Recommended Crates" onPress={() => navigation.navigate('RecommendedCrates', { bar })} color="#FFA500" />
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
