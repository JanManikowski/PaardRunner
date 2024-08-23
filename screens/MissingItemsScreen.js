import React, { useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, Button, ScrollView, Share, Alert, TouchableOpacity, TextInput, BackHandler } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData, saveData, removeData } from '../storage/AsyncStorageHelper';

const MissingItemsScreen = ({ route }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves, saveBarFridges, saveBarShelves } = useContext(FridgeContext);
  const [missingItems, setMissingItems] = useState([]);
  const [inputValues, setInputValues] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation();

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
    let items = [];

    if (barFridges[bar.name]) {
      const fridges = await Promise.all(
        barFridges[bar.name].map(async (fridge, index) => {
          const savedMissing = await getData(`fridge_${bar.name}_${index}`);
          return { ...fridge, missing: savedMissing !== null ? savedMissing : fridge.missing };
        })
      );
      fridges.forEach((item, fridgeIndex) => {
        if (item.missing > 0) {
          items.push({ ...item, bar: bar.name, fridgeIndex });
        }
      });
    }

    if (barShelves[bar.name]) {
      const shelves = await Promise.all(
        barShelves[bar.name].map(async (shelf, index) => {
          const savedMissing = await getData(`shelf_${bar.name}_${index}`);
          return { ...shelf, missing: savedMissing !== null ? savedMissing : shelf.missing };
        })
      );
      shelves.forEach((item, shelfIndex) => {
        if (item.missing > 0) {
          items.push({ ...item, bar: bar.name, shelfIndex });
        }
      });
    }

    setMissingItems(items);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMissingItems();
    }, [bar.name])
  );

  const generateMissingItemsMessage = () => {
    const header = `*${bar.name} is missing these items:*\n\n`;

    const maxTypeLength = Math.max(...missingItems.map(item => item.type.length));
    const maxMissingLength = Math.max(...missingItems.map(item => String(item.missing).length));

    const list = missingItems
      .map(item => {
        const paddedType = item.type.padEnd(maxTypeLength, ' ');
        const paddedMissing = String(item.missing).padStart(maxMissingLength, ' ');
        return `- ${paddedType} : ${paddedMissing}`;
      })
      .join('\n');

    return `\`\`\`${header}\n${list}\n\`\`\``;
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

  const removeItem = async (item, index) => {
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
              const updatedShelves = [...barShelves[bar.name]];
              updatedShelves[item.shelfIndex].missing = 0;
              setBarShelves(prev => ({ ...prev, [bar.name]: updatedShelves }));
              saveBarShelves(updatedShelves);
            } else {
              await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
              const updatedFridges = [...barFridges[bar.name]];
              updatedFridges[item.fridgeIndex].missing = 0;
              setBarFridges(prev => ({ ...prev, [bar.name]: updatedFridges }));
              saveBarFridges(updatedFridges);
            }
            setMissingItems(missingItems.filter((_, i) => i !== index));
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
            // Update both fridges and shelves
            let updatedFridges = [...barFridges[bar.name]];
            let updatedShelves = [...barShelves[bar.name]];
  
            for (let item of missingItems) {
              if (item.shelfIndex !== undefined) {
                await removeData(`shelf_${bar.name}_${item.shelfIndex}`);
                updatedShelves[item.shelfIndex].missing = 0;
              } else {
                await removeData(`fridge_${bar.name}_${item.fridgeIndex}`);
                updatedFridges[item.fridgeIndex].missing = 0;
              }
            }
  
            // Update context with the cleared data
            setBarFridges(prev => ({ ...prev, [bar.name]: updatedFridges }));
            setBarShelves(prev => ({ ...prev, [bar.name]: updatedShelves }));
  
            // Save the updated data to AsyncStorage
            saveBarFridges(updatedFridges);
            saveBarShelves(updatedShelves);
  
            // Clear the missing items from the current state
            setMissingItems([]);
          },
          style: "destructive"
        }
      ]
    );
  };
  

  const handleInputChange = (index, value) => {
    setInputValues(prev => ({ ...prev, [index]: value }));
    setIsEditing(true);
  };

  const handleInputBlur = async (item, index) => {
    const newCount = parseInt(inputValues[index], 10);
    if (!isNaN(newCount)) {
      await updateMissingCount(item, index, newCount);
    }
    setIsEditing(false);
  };

  const updateMissingCount = async (item, index, newCount) => {
    if (item.shelfIndex !== undefined) {
      const updatedShelves = [...barShelves[bar.name]];
      updatedShelves[item.shelfIndex].missing = newCount;
      setBarShelves(prev => ({ ...prev, [bar.name]: updatedShelves }));
      await saveData(`shelf_${bar.name}_${item.shelfIndex}`, newCount);
      saveBarShelves(updatedShelves);
    } else {
      const updatedFridges = [...barFridges[bar.name]];
      updatedFridges[item.fridgeIndex].missing = newCount;
      setBarFridges(prev => ({ ...prev, [bar.name]: updatedFridges }));
      await saveData(`fridge_${bar.name}_${item.fridgeIndex}`, newCount);
      saveBarFridges(updatedFridges);
    }
    setMissingItems(missingItems.map((itm, i) => (i === index ? { ...itm, missing: newCount } : itm)));
  };
  



  return (
    <View style={{
      padding: 16,
      backgroundColor: '#F8F8F8',
      flex: 1,
    }}>
      <Text style={{
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
      }}>
        Missing Items for {bar.name}
      </Text>
      <ScrollView style={{
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 5,
        shadowOffset: { width: 0, height: 2 },
        marginBottom: 20,
      }}>
        {missingItems.map((item, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}>
            <TouchableOpacity onPress={() => removeItem(item, index)} style={{ flex: 1 }}>
              <Text style={{
                fontSize: 16,
              }}>
                {item.type}
              </Text>
            </TouchableOpacity>
            <TextInput
              style={{
                fontSize: 16,
                fontWeight: 'bold',
                borderColor: '#ccc',
                borderWidth: 1,
                borderRadius: 5,
                width: 50,
                textAlign: 'center',
              }}
              value={inputValues[index] !== undefined ? inputValues[index] : String(item.missing)}
              keyboardType="numeric"
              onChangeText={(text) => handleInputChange(index, text)}
              onBlur={() => handleInputBlur(item, index)}
              onFocus={() => setIsEditing(true)}
            />
          </View>
        ))}
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
