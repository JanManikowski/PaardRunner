import React, { useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  BackHandler,
  Share,
  Button,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const ITEM_HEIGHT = 60;
const ITEM_SPACING = 10;

const AnimatedListItem = ({
  item,
  index,
  toggleItem,
  theme,
  circleMode,
  justEnteredSelectMode,
  decrementCount,
  incrementCount,
  inputValue,
  onInputChange,
  onInputBlur,
  onLongPress,
}) => {
  const translateY = useSharedValue(index * (ITEM_HEIGHT + ITEM_SPACING));

  useEffect(() => {
    translateY.value = withTiming(index * (ITEM_HEIGHT + ITEM_SPACING), { duration: 400 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 0,
          right: 0,
          height: ITEM_HEIGHT,
          backgroundColor: theme.colors.surfaceVariant,
          borderRadius: 8,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 10,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 3,
        },
        animatedStyle,
      ]}
    >
      {circleMode && (
        <TouchableOpacity
          onPress={toggleItem}
          style={{
            marginRight: 10,
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: theme.colors.primary,
            backgroundColor: item.completed ? theme.colors.primary : 'transparent',
          }}
        />
      )}
      <TouchableOpacity
        onPress={circleMode && !justEnteredSelectMode ? toggleItem : undefined}
        onLongPress={!circleMode ? onLongPress : undefined}
        style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}
      >
        <Image
          source={{ uri: item.image || 'placeholder.jpg' }}
          style={{
            width: 40,
            height: 40,
            marginRight: 10,
            borderRadius: 100,
            backgroundColor: 'white',
          }}
        />
        <Text style={{ fontSize: 16, color: theme.colors.text }}>{item.name}</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <TouchableOpacity onPress={decrementCount}>
          <Text style={{ fontSize: 24, marginHorizontal: 10, color: theme.colors.primary }}>-</Text>
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
          value={inputValue}
          keyboardType="numeric"
          onChangeText={onInputChange}
          onBlur={onInputBlur}
        />
        <TouchableOpacity onPress={incrementCount}>
          <Text style={{ fontSize: 24, marginHorizontal: 10, color: theme.colors.primary }}>+</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const MissingItemsScreen = ({ route }) => {
  const { bar } = route.params;
  const [missingItems, setMissingItems] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const [circleMode, setCircleMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [justEnteredSelectMode, setJustEnteredSelectMode] = useState(false);

  const bottomAnim = useSharedValue(0);

  useEffect(() => {
    bottomAnim.value = withTiming(circleMode ? 1 : 0, { duration: 300 });
  }, [circleMode, bottomAnim]);

  const normalBottomStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(bottomAnim.value, [0, 1], [0, 50]),
        },
      ],
      opacity: interpolate(bottomAnim.value, [0, 1], [1, 0]),
    };
  });

  const selectBottomStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(bottomAnim.value, [0, 1], [50, 0]),
        },
      ],
      opacity: bottomAnim.value,
    };
  });

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const fetchMissingItemsOnFocus = async () => {
        await fetchMissingItems();
      };
      fetchMissingItemsOnFocus();
    }, [bar.name])
  );

  const handleLongPressItem = () => {
    if (!circleMode) {
      setCircleMode(true);
      setJustEnteredSelectMode(true);
      setTimeout(() => {
        setJustEnteredSelectMode(false);
      }, 500);
    }
  };

  const handleToggleCompleted = (category, index, item) => {
    let updatedItems = [...missingItems[category]];
    const [toggledItem] = updatedItems.splice(index, 1);
    const newStatus = !toggledItem.completed;
    toggledItem.completed = newStatus;
    if (newStatus) {
      toggledItem.toggledAt = Date.now();
    } else {
      delete toggledItem.toggledAt;
    }
    const nonCompleted = updatedItems.filter(it => !it.completed);
    const completed = updatedItems.filter(it => it.completed);
    if (newStatus) {
      completed.push(toggledItem);
      completed.sort((a, b) => b.toggledAt - a.toggledAt);
    } else {
      nonCompleted.push(toggledItem);
    }
    const newOrder = nonCompleted.concat(completed);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMissingItems(prev => ({ ...prev, [category]: newOrder }));
    setCheckedItems(prev => {
      const key = `${category}-${item.id}`;
      return newStatus ? [...prev, key] : prev.filter(entry => entry !== key);
    });
  };

  const deleteCheckedItems = async () => {
    Alert.alert(
      'Delete Checked Items',
      'Are you sure you want to delete all selected items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedMissingItems = { ...missingItems };
            for (const key of checkedItems) {
              const [category, itemId] = key.split('-');
              if (!updatedMissingItems[category]) continue;
              const itemIndex = updatedMissingItems[category].findIndex(it => it.id === itemId);
              if (itemIndex !== -1) {
                const item = updatedMissingItems[category][itemIndex];
                await AsyncStorage.removeItem(`missing_${item.id}_${bar.orgId}_${bar.name}`);
                updatedMissingItems[category].splice(itemIndex, 1);
                if (category === 'Custom Items') {
                  const customItemsKey = `custom_missing_items_${bar.orgId}_${bar.name}`;
                  let customItems = JSON.parse(await AsyncStorage.getItem(customItemsKey)) || [];
                  customItems = customItems.filter(customItem => customItem.id !== item.id);
                  await AsyncStorage.setItem(customItemsKey, JSON.stringify(customItems));
                }
                if (updatedMissingItems[category].length === 0) {
                  delete updatedMissingItems[category];
                }
              }
            }
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMissingItems(updatedMissingItems);
            setCheckedItems([]);
          },
        },
      ]
    );
  };

  useEffect(() => {
    const backAction = () => {
      if (isEditing) {
        Alert.alert(
          'Finish Editing',
          'Please finish editing before navigating back.',
          [{ text: 'OK' }],
          { cancelable: false }
        );
        return true;
      }
      if (circleMode) {
        setCircleMode(false);
        setCheckedItems([]);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    const beforeRemoveListener = navigation.addListener('beforeRemove', e => {
      if (isEditing || circleMode) {
        e.preventDefault();
        if (circleMode) {
          setCircleMode(false);
          setCheckedItems([]);
        } else {
          Alert.alert(
            'Finish Editing',
            'Please finish editing before leaving this screen.',
            [{ text: 'OK' }],
            { cancelable: false }
          );
        }
      }
    });

    return () => {
      backHandler.remove();
      beforeRemoveListener();
    };
  }, [isEditing, circleMode, navigation]);

  const fetchMissingItems = async () => {
    const categorizedItems = {};
    const categoriesKey = `categories_${bar.orgId}`;
    const storedCategories = JSON.parse(await AsyncStorage.getItem(categoriesKey)) || [];
    for (const category of storedCategories) {
      for (const item of category.items || []) {
        const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
        const savedMissing = await AsyncStorage.getItem(missingKey);
        const missingAmount = savedMissing ? parseInt(savedMissing, 10) : 0;
        if (missingAmount > 0) {
          if (!categorizedItems[category.name]) {
            categorizedItems[category.name] = [];
          }
          categorizedItems[category.name].push({
            ...item,
            missing: missingAmount,
            completed: false,
          });
        }
      }
    }
    const customItemsKey = `custom_missing_items_${bar.orgId}_${bar.name}`;
    const customItems = JSON.parse(await AsyncStorage.getItem(customItemsKey)) || [];
    if (customItems.length > 0) {
      categorizedItems['Custom Items'] = customItems.map(item => ({
        ...item,
        missing: 1,
        completed: false,
      }));
    }
    setMissingItems(Object.keys(categorizedItems).length ? categorizedItems : null);
  };

  const generateMissingItemsMessage = () => {
    let message = `*${bar.name}:*\n`;
    if (missingItems) {
      Object.entries(missingItems).forEach(([category, items]) => {
        if (items.length > 0) {
          message += `*${category}:*\n\`\`\`\n`;
          items.forEach(item => {
            const label = item.type ? item.type : item.name;
            message += `- ${label.padEnd(20, ' ')} : ${String(item.missing).padStart(3, ' ')}\n`;
          });
          message += "```\n";
        }
      });
    } else {
      message += '\nNo missing items found.';
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
      await Share.share({ message });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleInputChange = (category, index, value) => {
    const updatedItems = [...missingItems[category]];
    updatedItems[index].missing = value;
    setInputValues(prev => ({ ...prev, [`${category}-${index}`]: value }));
  };

  const handleInputBlur = async (category, index) => {
    const updatedItems = [...missingItems[category]];
    const newCount = parseInt(inputValues[`${category}-${index}`], 10);
    if (!isNaN(newCount)) {
      updatedItems[index].missing = newCount;
      const missingKey = `missing_${updatedItems[index].id}_${bar.orgId}_${bar.name}`;
      await AsyncStorage.setItem(missingKey, newCount.toString());
    }
    setMissingItems(prev => ({ ...prev, [category]: updatedItems }));
    setIsEditing(false);
  };

  const updateMissingValue = async (category, index, newValue) => {
    const updatedItems = [...missingItems[category]];
    updatedItems[index].missing = newValue;
    setMissingItems(prev => ({ ...prev, [category]: updatedItems }));
    const missingKey = `missing_${updatedItems[index].id}_${bar.orgId}_${bar.name}`;
    await AsyncStorage.setItem(missingKey, newValue.toString());
    setInputValues(prev => ({ ...prev, [`${category}-${index}`]: newValue.toString() }));
  };

  const incrementCount = async (category, index) => {
    const currentValue =
      parseInt(inputValues[`${category}-${index}`], 10) || missingItems[category][index].missing;
    const updatedValue = currentValue + 1;
    await updateMissingValue(category, index, updatedValue);
  };

  const decrementCount = async (category, index) => {
    const currentValue =
      parseInt(inputValues[`${category}-${index}`], 10) || missingItems[category][index].missing;
    const updatedValue = currentValue > 0 ? currentValue - 1 : 0;
    await updateMissingValue(category, index, updatedValue);
  };

  const deleteItem = async (category, index) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete ${missingItems[category][index].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updatedItems = [...missingItems[category]];
            const item = updatedItems[index];
            updatedItems.splice(index, 1);
            await AsyncStorage.removeItem(`missing_${item.id}_${bar.orgId}_${bar.name}`);
            if (category === 'Custom Items') {
              const customItemsKey = `custom_missing_items_${bar.orgId}_${bar.name}`;
              let customItems = JSON.parse(await AsyncStorage.getItem(customItemsKey)) || [];
              customItems = customItems.filter(customItem => customItem.id !== item.id);
              await AsyncStorage.setItem(customItemsKey, JSON.stringify(customItems));
            }
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMissingItems(prev => ({ ...prev, [category]: updatedItems }));
          },
        },
      ]
    );
  };

  const deleteCategory = async category => {
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
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMissingItems(updatedMissingItems);
            if (category === 'Custom Items') {
              await AsyncStorage.removeItem(`custom_missing_items_${bar.orgId}_${bar.name}`);
            }
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
            if (missingItems) {
              for (const [category, items] of Object.entries(missingItems)) {
                for (const item of items) {
                  await AsyncStorage.removeItem(`missing_${item.id}_${bar.orgId}_${bar.name}`);
                }
              }
            }
            await AsyncStorage.removeItem(`custom_missing_items_${bar.orgId}_${bar.name}`);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setMissingItems(null);
          },
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16 }}>
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 10,
          textAlign: 'center',
          color: theme.colors.onBackground,
        }}
      >
        Missing Items for {bar.name}
      </Text>
      <ScrollView
        style={{
          backgroundColor: '#343C3D',
          padding: 15,
          borderRadius: 8,
          marginBottom: 150,  
        }}
        contentContainerStyle={{ paddingBottom: 15 }}
      >
        {missingItems ? (
          Object.entries(missingItems).map(([category, items]) => (
            <View key={category} style={{ marginBottom: 20 }}>
              <TouchableOpacity onPress={() => deleteCategory(category)}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    color: theme.colors.primary,
                  }}
                >
                  {category}
                </Text>
              </TouchableOpacity>
              <View style={{ position: 'relative', minHeight: items.length * (ITEM_HEIGHT + ITEM_SPACING) }}>
                {items.map((item, index) => (
                  <AnimatedListItem
                    key={item.id}
                    item={item}
                    index={index}
                    toggleItem={() => handleToggleCompleted(category, index, item)}
                    theme={theme}
                    circleMode={circleMode}
                    justEnteredSelectMode={justEnteredSelectMode}
                    decrementCount={() => decrementCount(category, index)}
                    incrementCount={() => incrementCount(category, index)}
                    inputValue={
                      inputValues[`${category}-${index}`] !== undefined
                        ? inputValues[`${category}-${index}`]
                        : String(item.missing)
                    }
                    onInputChange={text => handleInputChange(category, index, text)}
                    onInputBlur={() => handleInputBlur(category, index)}
                    onLongPress={handleLongPressItem}
                  />
                ))}
              </View>
            </View>
          ))
        ) : (
          <Text style={{ fontSize: 18, textAlign: 'center', color: theme.colors.onSurface }}>
            No missing items found.
          </Text>
        )}
      </ScrollView>

<View style={{ position: 'absolute', left: 16, right: 16, bottom: 145 }}>
  <Animated.View
    style={[
      normalBottomStyle,
      {
        position: 'absolute',
        width: '100%',
        pointerEvents: circleMode ? 'none' : 'auto',
      },
    ]}
  >
    <View style={{ marginBottom: 10 }}>
      <Button
        title="Show Recommended Crates"
        onPress={() => navigation.navigate('RecommendedCrates', { bar })}
        color="#FFA500"
      />
    </View>
    <View style={{ marginBottom: 10 }}>
      <Button title="Share List" onPress={shareList} color="#4CAF50" />
    </View>
    <View style={{ marginBottom: 10 }}>
      <Button title="Delete All Items" onPress={deleteAllItemsForBar} color="#FF3B30" />
    </View>
  </Animated.View>
  

  <Animated.View
    style={[
      selectBottomStyle,
      {
        position: 'absolute',
        width: '100%',
        pointerEvents: circleMode ? 'auto' : 'none',
      },
    ]}
  >
    <View style={{ marginBottom: 10 }}>
      <Button title="Delete Selected Items" onPress={deleteCheckedItems} color="#FF3B30" />
    </View>
    <View style={{ marginBottom: 10 }}>
      <Button
        title="Exit Select Mode"
        onPress={() => {
          setCircleMode(false);
          setCheckedItems([]);
        }}
        color="#007AFF"
      />
    </View>
  </Animated.View>
</View>

    </View>
  );
};

export default MissingItemsScreen;
