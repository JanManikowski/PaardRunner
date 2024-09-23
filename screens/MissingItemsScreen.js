import React, { useContext, useState, useCallback, useEffect } from 'react';
import { View, Text, Button, ScrollView, Alert, TouchableOpacity, TextInput, BackHandler, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { CategoryContext } from '../contexts/CategoryContext';

const MissingItemsScreen = ({ route }) => {
  const { bar } = route.params;
  const { categories } = useContext(CategoryContext);  // Access custom categories from context
  const [missingItems, setMissingItems] = useState({ customItems: [], liquorItems: [] });  // Liquor and custom items
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

  // Fetch missing items from custom categories and strong liquor
  const fetchMissingItems = async () => {
    let customItems = [];
    let liquorItems = [];

    // Ensure categories are defined before trying to loop through them
    if (categories) {
      // Fetch missing items from custom categories
      for (const categoryName of Object.keys(categories)) {
        const categoryItems = categories[categoryName].filter(item => item.missing > 0);  // Only include missing items
        customItems = [...customItems, { categoryName, items: categoryItems }];  // Group items by category
      }
    }

    // Fetch missing strong liquor items per bar
    const storedLiquorCounts = await AsyncStorage.getItem(`liquorCounts_${bar.name}`);
    const liquorCounts = storedLiquorCounts ? JSON.parse(storedLiquorCounts) : {};
    Object.keys(liquorCounts).forEach((liquor) => {
      if (liquorCounts[liquor] > 0) {
        liquorItems.push({ type: liquor, missing: liquorCounts[liquor] });
      }
    });

    setMissingItems({ customItems, liquorItems });
  };

  useFocusEffect(
    useCallback(() => {
      fetchMissingItems();
    }, [bar.name, categories])
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

    const customList = missingItems.customItems
      .map(categoryData => generateCategoryList(categoryData.items, `${categoryData.categoryName} Items`))
      .join('\n');
    const liquorList = generateCategoryList(missingItems.liquorItems, 'Strong Liquor Items');

    return `${header}${customList}${liquorList}`;
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

  const removeItem = async (item, categoryIndex, itemIndex) => {
    const category = missingItems.customItems[categoryIndex];
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
            let updatedItems = [...category.items];
            updatedItems.splice(itemIndex, 1);  // Remove the item

            const updatedCustomItems = [...missingItems.customItems];
            updatedCustomItems[categoryIndex].items = updatedItems;
            setMissingItems(prev => ({ ...prev, customItems: updatedCustomItems }));

            setInputValues(prev => ({ ...prev, [`${category.categoryName}-${itemIndex}`]: '' }));
          },
          style: "destructive"
        }
      ]
    );
  };

  const removeCategoryItems = (categoryIndex, categoryName) => {
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
            const updatedCustomItems = [...missingItems.customItems];
            updatedCustomItems[categoryIndex].items = [];
            setMissingItems(prev => ({ ...prev, customItems: updatedCustomItems }));
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleInputChange = (categoryIndex, itemIndex, value) => {
    const updatedCategoryItems = [...missingItems.customItems];
    updatedCategoryItems[categoryIndex].items[itemIndex].missing = value;
    setInputValues(prev => ({ ...prev, [`${updatedCategoryItems[categoryIndex].categoryName}-${itemIndex}`]: value }));
  };

  const handleInputBlur = async (categoryIndex, itemIndex) => {
    const category = missingItems.customItems[categoryIndex];
    const newCount = parseInt(inputValues[`${category.categoryName}-${itemIndex}`], 10);
    if (!isNaN(newCount)) {
      category.items[itemIndex].missing = newCount;
    }
    setIsEditing(false);
  };

  const incrementCount = async (categoryIndex, itemIndex) => {
    const category = missingItems.customItems[categoryIndex];
    const currentValue = parseInt(inputValues[`${category.categoryName}-${itemIndex}`], 10) || category.items[itemIndex].missing;
    const updatedValue = currentValue + 1;
    handleInputChange(categoryIndex, itemIndex, String(updatedValue));
  };

  const decrementCount = async (categoryIndex, itemIndex) => {
    const category = missingItems.customItems[categoryIndex];
    const currentValue = parseInt(inputValues[`${category.categoryName}-${itemIndex}`], 10) || category.items[itemIndex].missing;
    const updatedValue = currentValue > 0 ? currentValue - 1 : 0;
    handleInputChange(categoryIndex, itemIndex, String(updatedValue));
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

        {/* Custom Items */}
        {missingItems.customItems.length > 0 && missingItems.customItems.map((categoryData, categoryIndex) => (
          <View key={categoryData.categoryName}>
            <TouchableOpacity onPress={() => removeCategoryItems(categoryIndex, `${categoryData.categoryName} Items`)}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: theme.colors.tertiary }}>
                {categoryData.categoryName} Items
              </Text>
            </TouchableOpacity>
            {categoryData.items.map((item, itemIndex) => (
              <View key={itemIndex} style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}>
                <TouchableOpacity onPress={() => removeItem(item, categoryIndex, itemIndex)} style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                  }}>
                    {item.name} {/* Display item name */}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => decrementCount(categoryIndex, itemIndex)}>
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
                  value={inputValues[`${categoryData.categoryName}-${itemIndex}`] !== undefined ? inputValues[`${categoryData.categoryName}-${itemIndex}`] : String(item.missing)}
                  keyboardType="numeric"
                  onChangeText={(text) => handleInputChange(categoryIndex, itemIndex, text)}
                  onBlur={() => handleInputBlur(categoryIndex, itemIndex)}
                  onFocus={() => setIsEditing(true)}
                />
                <TouchableOpacity onPress={() => incrementCount(categoryIndex, itemIndex)}>
                    <Text style={{
                      fontSize: 24,
                      marginHorizontal: 10,
                      color: theme.colors.primary,
                    }}>+</Text>
                  </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}

        {/* Strong Liquor Items */}
        {missingItems.liquorItems.length > 0 && (
          <>
            <TouchableOpacity onPress={() => removeCategoryItems(-1, 'Strong Liquor Items')}>
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
                <TouchableOpacity onPress={() => removeItem(item, -1, index)} style={{ flex: 1 }}>
                  <Text style={{
                    fontSize: 16,
                    color: theme.colors.text,
                  }}>
                    {item.type}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => decrementCount(-1, index)}>
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
                  onChangeText={(text) => handleInputChange(-1, index, text)}
                  onBlur={() => handleInputBlur(-1, index)}
                  onFocus={() => setIsEditing(true)}
                />
                <TouchableOpacity onPress={() => incrementCount(-1, index)}>
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

      {/* Recommended Crates Button */}
      <View style={{ marginBottom: 10 }}>
        <Button title="Show Recommended Crates" onPress={() => navigation.navigate('RecommendedCrates', { bar })} color="#FFA500" />
      </View>

      <View style={{ marginBottom: 10 }}>
        <Button title="Share List" onPress={shareList} color="#4CAF50" />
      </View>

      <View style={{ marginBottom: 10 }}>
        <Button title="Remove All Items" onPress={() => removeCategoryItems(-1, 'Custom Items')} color="#FF3B30" />
      </View>
    </View>
  );
};

export default MissingItemsScreen;
