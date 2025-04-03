import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Button,
  Image,
  LayoutAnimation,
  Platform,
  UIManager,
  Share,
  StyleSheet,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

// Reuse from MissingItemsScreen
const ITEM_HEIGHT = 60;
const ITEM_SPACING = 10;

// Reusable animated list item
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
          marginBottom: ITEM_SPACING,
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

const AllMissingItemsScreen = () => {
  const { theme } = useContext(ThemeContext);

  // Data: { barName: { categoryName: [item, ...] } }
  const [aggregatedData, setAggregatedData] = useState({});
  const [inputValues, setInputValues] = useState({});
  const [circleMode, setCircleMode] = useState(false);
  const [checkedItems, setCheckedItems] = useState([]);
  const [justEnteredSelectMode, setJustEnteredSelectMode] = useState(false);

  // Collapsible state: barName => bool
  const [expandedBars, setExpandedBars] = useState({});

  // Animate bottom buttons (as in MissingItemsScreen)
  const bottomAnim = useSharedValue(0);
  useEffect(() => {
    bottomAnim.value = withTiming(circleMode ? 1 : 0, { duration: 300 });
  }, [circleMode]);

  const normalBottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bottomAnim.value, [0, 1], [0, 50]) }],
    opacity: interpolate(bottomAnim.value, [0, 1], [1, 0]),
  }));

  const selectBottomStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(bottomAnim.value, [0, 1], [50, 0]) }],
    opacity: bottomAnim.value,
  }));

  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Fetch missing items on focus
  useFocusEffect(
    React.useCallback(() => {
      fetchAllMissingItems();
    }, [])
  );

  const fetchAllMissingItems = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        setAggregatedData({});
        return;
      }
      const storedBars = await AsyncStorage.getItem(`bars_${activeOrgId}`);
      const bars = storedBars ? JSON.parse(storedBars) : [];
      const storedItems = await AsyncStorage.getItem(`items_${activeOrgId}`);
      const items = storedItems ? JSON.parse(storedItems) : [];

      const aggregated = {};
      for (const bar of bars) {
        let barData = {};
        for (const item of items) {
          const missingKey = `missing_${item.id}_${bar.orgId}_${bar.name}`;
          const savedMissing = await AsyncStorage.getItem(missingKey);
          const missingAmount = savedMissing ? parseInt(savedMissing, 10) : 0;
          if (missingAmount > 0) {
            const category = item.categoryName || 'Uncategorized';
            if (!barData[category]) {
              barData[category] = [];
            }
            barData[category].push({
              ...item,
              missing: missingAmount,
              barName: bar.name,
              orgId: bar.orgId,
              completed: false,
            });
          }
        }
        if (Object.keys(barData).length > 0) {
          aggregated[bar.name] = barData;
        }
      }
      setAggregatedData(aggregated);
    } catch (error) {
      console.error('Error fetching aggregated missing items:', error);
    }
  };

  // Collapsible toggling
  const toggleBar = (barName) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedBars(prev => ({
      ...prev,
      [barName]: !prev[barName],
    }));
  };

  // Updating missing values
  const updateMissingValue = async (barName, category, index, newValue) => {
    const updated = { ...aggregatedData };
    const item = updated[barName][category][index];
    item.missing = newValue;
    setAggregatedData(updated);
    const missingKey = `missing_${item.id}_${item.orgId}_${barName}`;
    await AsyncStorage.setItem(missingKey, newValue.toString());
    setInputValues(prev => ({
      ...prev,
      [`${barName}-${category}-${index}`]: newValue.toString(),
    }));
  };

  const handleInputChange = (barName, category, index, value) => {
    setInputValues(prev => ({ ...prev, [`${barName}-${category}-${index}`]: value }));
  };

  const handleInputBlur = async (barName, category, index) => {
    const key = `${barName}-${category}-${index}`;
    const newCount = parseInt(inputValues[key], 10);
    if (!isNaN(newCount)) {
      await updateMissingValue(barName, category, index, newCount);
    }
  };

  const incrementCount = async (barName, category, index) => {
    const key = `${barName}-${category}-${index}`;
    const currentValue =
      parseInt(inputValues[key], 10) ||
      aggregatedData[barName][category][index].missing;
    const updatedValue = currentValue + 1;
    await updateMissingValue(barName, category, index, updatedValue);
  };

  const decrementCount = async (barName, category, index) => {
    const key = `${barName}-${category}-${index}`;
    const currentValue =
      parseInt(inputValues[key], 10) ||
      aggregatedData[barName][category][index].missing;
    const updatedValue = currentValue > 0 ? currentValue - 1 : 0;
    await updateMissingValue(barName, category, index, updatedValue);
  };

  // Toggle completed & track multi-select
  const handleToggleCompleted = (barName, category, index, item) => {
    const updated = { ...aggregatedData };
    const targetItem = updated[barName][category][index];
    const newStatus = !targetItem.completed;
    targetItem.completed = newStatus;
    if (newStatus) {
      targetItem.toggledAt = Date.now();
    } else {
      delete targetItem.toggledAt;
    }

    // reorder: non-completed first, completed after
    const items = [...updated[barName][category]];
    items.splice(index, 1);
    const nonCompleted = items.filter(it => !it.completed);
    const completed = items.filter(it => it.completed);
    if (newStatus) {
      completed.push(targetItem);
      completed.sort((a, b) => b.toggledAt - a.toggledAt);
    } else {
      nonCompleted.push(targetItem);
    }
    updated[barName][category] = nonCompleted.concat(completed);

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setAggregatedData(updated);

    setCheckedItems(prev => {
      const key = `${barName}-${category}-${item.id}`;
      return newStatus ? [...prev, key] : prev.filter(entry => entry !== key);
    });
  };

  // Long press to enter multi-select
  const handleLongPressItem = () => {
    if (!circleMode) {
      setCircleMode(true);
      setJustEnteredSelectMode(true);
      setTimeout(() => {
        setJustEnteredSelectMode(false);
      }, 500);
    }
  };

  // Delete selected items
  const deleteCheckedItems = async () => {
    Alert.alert(
      'Delete Selected Items',
      'Are you sure you want to delete all selected items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = { ...aggregatedData };
            for (const key of checkedItems) {
              const [barName, category, itemId] = key.split('-');
              if (updated[barName] && updated[barName][category]) {
                const idx = updated[barName][category].findIndex(i => i.id === itemId);
                if (idx !== -1) {
                  const item = updated[barName][category][idx];
                  await AsyncStorage.removeItem(`missing_${item.id}_${item.orgId}_${barName}`);
                  updated[barName][category].splice(idx, 1);
                  if (updated[barName][category].length === 0) {
                    delete updated[barName][category];
                  }
                  if (Object.keys(updated[barName]).length === 0) {
                    delete updated[barName];
                  }
                }
              }
            }
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setAggregatedData(updated);
            setCheckedItems([]);
          },
        },
      ]
    );
  };

  // Delete all items for a given bar
  const deleteAllItemsForBar = async (barName) => {
    Alert.alert(
      'Delete All Items',
      `Are you sure you want to delete all missing items for ${barName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = { ...aggregatedData };
            if (updated[barName]) {
              for (const category in updated[barName]) {
                for (const item of updated[barName][category]) {
                  const key = `missing_${item.id}_${item.orgId}_${barName}`;
                  await AsyncStorage.removeItem(key);
                }
              }
              delete updated[barName];
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              setAggregatedData(updated);
            }
          },
        },
      ]
    );
  };

  // Generate a shareable message
  const generateAllMissingItemsMessage = () => {
    if (Object.keys(aggregatedData).length === 0) {
      return 'No missing items found across all bars.';
    }
    let message = 'All Missing Items:\n\n';
    for (const barName in aggregatedData) {
      message += `*${barName}*\n`;
      const categories = aggregatedData[barName];
      for (const category in categories) {
        message += `  *${category}:*\n\`\`\`\n`;
        categories[category].forEach(item => {
          const label = item.type ? item.type : item.name;
          message += `  - ${label.padEnd(20, ' ')} : ${String(item.missing).padStart(3, ' ')}\n`;
        });
        message += '```\n\n';
      }
    }
    return message.trim();
  };

  const shareList = async () => {
    const message = generateAllMissingItemsMessage();
    try {
      await Share.share({ message });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.onBackground }]}>
        All Missing Items
      </Text>

      <ScrollView
        style={{ marginBottom: 150 }}
        contentContainerStyle={{ paddingBottom: 15 }}
      >
        {Object.keys(aggregatedData).length > 0 ? (
          Object.entries(aggregatedData).map(([barName, categories]) => {
            const isExpanded = expandedBars[barName] || false;
            return (
              <View key={barName} style={styles.barCard}>
                {/* Bar Header */}
                <TouchableOpacity
                  onPress={() => toggleBar(barName)}
                  onLongPress={() => deleteAllItemsForBar(barName)}
                  style={styles.barHeader}
                >
                  <Text style={[styles.barTitle, { color: theme.colors.primary }]}>
                    {barName}
                  </Text>
                  <Text style={styles.caret}>
                    {isExpanded ? '▲' : '▼'}
                  </Text>
                </TouchableOpacity>

                {/* Collapsible content */}
                {isExpanded && (
                  <View style={styles.barContent}>
                    {Object.entries(categories).map(([category, items]) => (
                      <View key={category} style={{ marginBottom: 20 }}>
                        <Text style={[styles.categoryTitle, { color: theme.colors.primary }]}>
                          {category}
                        </Text>
                        <View style={{
                          position: 'relative',
                          minHeight: items.length * (ITEM_HEIGHT + ITEM_SPACING),
                        }}>
                          {items.map((item, index) => (
                            <AnimatedListItem
                              key={item.id}
                              item={item}
                              index={index}
                              theme={theme}
                              circleMode={circleMode}
                              justEnteredSelectMode={justEnteredSelectMode}
                              toggleItem={() => handleToggleCompleted(barName, category, index, item)}
                              decrementCount={() => decrementCount(barName, category, index)}
                              incrementCount={() => incrementCount(barName, category, index)}
                              inputValue={
                                inputValues[`${barName}-${category}-${index}`] !== undefined
                                  ? inputValues[`${barName}-${category}-${index}`]
                                  : String(item.missing)
                              }
                              onInputChange={text => handleInputChange(barName, category, index, text)}
                              onInputBlur={() => handleInputBlur(barName, category, index)}
                              onLongPress={handleLongPressItem}
                            />
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <Text style={{ fontSize: 18, textAlign: 'center', color: theme.colors.onSurface }}>
            No missing items found.
          </Text>
        )}
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomButtonsContainer}>
        {/* Normal buttons */}
        <Animated.View
          style={[
            normalBottomStyle,
            styles.bottomButtons,
            { pointerEvents: circleMode ? 'none' : 'auto' },
          ]}
        >
          <View style={styles.buttonSpacing}>
            <Button title="Share List" onPress={shareList} color="#4CAF50" />
          </View>
          <View style={styles.buttonSpacing}>
            <Button
              title="Delete All Items"
              onPress={() => {
                Alert.alert(
                  'Delete All Items',
                  'Delete all missing items for all bars?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: async () => {
                        const updated = { ...aggregatedData };
                        for (const bName in updated) {
                          for (const cat in updated[bName]) {
                            for (const it of updated[bName][cat]) {
                              await AsyncStorage.removeItem(`missing_${it.id}_${it.orgId}_${bName}`);
                            }
                          }
                        }
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setAggregatedData({});
                      },
                    },
                  ]
                );
              }}
              color="#FF3B30"
            />
          </View>
        </Animated.View>

        {/* Select mode buttons */}
        <Animated.View
          style={[
            selectBottomStyle,
            styles.bottomButtons,
            { pointerEvents: circleMode ? 'auto' : 'none' },
          ]}
        >
          <View style={styles.buttonSpacing}>
            <Button title="Delete Selected Items" onPress={deleteCheckedItems} color="#FF3B30" />
          </View>
          <View style={styles.buttonSpacing}>
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

// Basic styling to make the layout look more modern
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  barCard: {
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#2F3535', // or theme.colors.surfaceVariant
    padding: 5,
  },
  barHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
  },
  barTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  caret: {
    fontSize: 18,
    color: '#aaa',
    marginRight: 5,
  },
  barContent: {
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  bottomButtonsContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 145,
  },
  bottomButtons: {
    position: 'absolute',
    width: '100%',
  },
  buttonSpacing: {
    marginBottom: 10,
  },
});

export default AllMissingItemsScreen;
