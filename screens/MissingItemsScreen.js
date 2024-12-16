import React, { useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity, TextInput, BackHandler, Share, Button } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const MissingItemsScreen = ({ route }) => {
  const { bar } = route.params;
  const [missingItems, setMissingItems] = useState({});
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

  // Fetch missing items from all categories for the given bar
  const fetchMissingItems = async () => {
    let categorizedItems = {};

    const storedItems = JSON.parse(await AsyncStorage.getItem('items')) || [];
    const filteredItems = storedItems.filter(item => item.orgId === bar.orgId);

    // Fetch missing amounts for each item
    for (const item of filteredItems) {
      const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
      const savedMissing = await AsyncStorage.getItem(missingKey);
      const missingAmount = savedMissing ? parseInt(savedMissing, 10) : 0;

      if (missingAmount > 0) {
        if (!categorizedItems[item.categoryName]) {
          categorizedItems[item.categoryName] = [];
        }
        categorizedItems[item.categoryName].push({ ...item, missing: missingAmount });
      }
    }

    if (Object.keys(categorizedItems).length === 0) {
      setMissingItems(null);
    } else {
      setMissingItems(categorizedItems);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMissingItems();
    }, [bar.name])
  );

  const generateMissingItemsMessage = () => {
    const header = `*${bar.name} is missing these items:*`;

    let message = header;
    if (missingItems) {
      for (const [category, items] of Object.entries(missingItems)) {
        if (items.length > 0) {
          message += `*${category}:*\n\`\`\``;
          items.forEach(item => {
            message += `- ${item.type.padEnd(20, ' ')}: ${String(item.missing).padStart(3, ' ')}`;
          });
          message += '```';
        }
      }
    } else {
      message += 'No missing items found.';
    }
    return message;
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

  const handleInputChange = (category, itemIndex, value) => {
    const updatedItems = [...missingItems[category]];
    updatedItems[itemIndex].missing = value;
    setInputValues(prev => ({ ...prev, [`${category}-${itemIndex}`]: value }));
  };

  const handleInputBlur = (category, itemIndex) => {
    const updatedItems = [...missingItems[category]];
    const newCount = parseInt(inputValues[`${category}-${itemIndex}`], 10);
    if (!isNaN(newCount)) {
      updatedItems[itemIndex].missing = newCount;
    }
    setMissingItems(prev => ({ ...prev, [category]: updatedItems }));
    setIsEditing(false);
  };

  const incrementCount = (category, itemIndex) => {
    const currentValue = parseInt(inputValues[`${category}-${itemIndex}`], 10) || missingItems[category][itemIndex].missing;
    const updatedValue = currentValue + 1;
    handleInputChange(category, itemIndex, String(updatedValue));
  };

  const decrementCount = (category, itemIndex) => {
    const currentValue = parseInt(inputValues[`${category}-${itemIndex}`], 10) || missingItems[category][itemIndex].missing;
    const updatedValue = currentValue > 0 ? currentValue - 1 : 0;
    handleInputChange(category, itemIndex, String(updatedValue));
  };

  const deleteItem = async (category, itemIndex) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${missingItems[category][itemIndex].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = [...missingItems[category]];
            const item = updatedItems[itemIndex];
            updatedItems.splice(itemIndex, 1);
            await AsyncStorage.removeItem(`missing_${item.id}_${bar.orgId}_${bar.name}`);
            setMissingItems(prev => ({ ...prev, [category]: updatedItems }));
          },
        },
      ]
    );
  };

  const deleteCategory = async (category) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete all items in ${category}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const items = missingItems[category];
            for (const item of items) {
              await AsyncStorage.removeItem(`missing_${item.id}_${bar.orgId}_${bar.name}`);
            }
            const updatedMissingItems = { ...missingItems };
            delete updatedMissingItems[category];
            setMissingItems(updatedMissingItems);
          },
        },
      ]
    );
  };

  const deleteAllItemsForBar = async () => {
    Alert.alert(
      'Delete All Items',
      `Are you sure you want to delete all missing items for ${bar.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            for (const [category, items] of Object.entries(missingItems)) {
              for (const item of items) {
                await AsyncStorage.removeItem(`missing_${item.id}_${bar.orgId}_${bar.name}`);
              }
            }
            setMissingItems(null);
          },
        },
      ]
    );
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
        {missingItems ? (
          Object.entries(missingItems).map(([category, items]) => (
            <View key={category} style={{ marginBottom: 20 }}>
              <TouchableOpacity onPress={() => deleteCategory(category)}>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 10,
                  color: theme.colors.primary,
                }}>
                  {category}
                </Text>
              </TouchableOpacity>
              {items.map((item, itemIndex) => (
                <View key={itemIndex} style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                }}>
                  <TouchableOpacity onPress={() => deleteItem(category, itemIndex)} style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      color: theme.colors.text,
                    }}>
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => decrementCount(category, itemIndex)}>
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
                      value={inputValues[`${category}-${itemIndex}`] !== undefined ? inputValues[`${category}-${itemIndex}`] : String(item.missing)}
                      keyboardType="numeric"
                      onChangeText={(text) => handleInputChange(category, itemIndex, text)}
                      onBlur={() => handleInputBlur(category, itemIndex)}
                      onFocus={() => setIsEditing(true)}
                    />
                    <TouchableOpacity onPress={() => incrementCount(category, itemIndex)}>
                      <Text style={{
                        fontSize: 24,
                        marginHorizontal: 10,
                        color: theme.colors.primary,
                      }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        ) : (
          <Text style={{
            fontSize: 18,
            textAlign: 'center',
            color: theme.colors.onSurface,
          }}>
            No missing items found.
          </Text>
        )}
      </ScrollView>

      <View style={{ marginBottom: 10 }}>
        <Button title="Show Recommended Crates" onPress={() => navigation.navigate('RecommendedCrates', { bar })} color="#FFA500" />
      </View>

      <View style={{ marginBottom: 10 }}>
        <Button title="Share List" onPress={shareList} color="#4CAF50" />
      </View>

      <View style={{ marginBottom: 10 }}>
        <Button title="Delete All Items" onPress={deleteAllItemsForBar} color="#FF3B30" />
      </View>
    </View>
  );
};

export default MissingItemsScreen;
