import React, { useState, useEffect, useContext } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text, Button, Icon, Switch } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import WheelColorPicker from 'react-native-wheel-color-picker';
import { ThemeContext } from '../contexts/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

const ViewBarsScreen = ({ navigation, route }) => {
  const [bars, setBars] = useState([]);
  const [selectedBar, setSelectedBar] = useState(null);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [pickedColor, setPickedColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#000000'); // Default text color is black
  const [animatedValue] = useState(new Animated.Value(0));
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [iconOpacity] = useState(new Animated.Value(1)); // New animated value for the icon opacity

  useEffect(() => {
    // Create a loop with a 5-second delay before the flashing effect
    Animated.loop(
      Animated.sequence([
        // Keep the icon fully visible for 5 seconds
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        // Flash effect: fade out
        Animated.timing(iconOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        // Flash effect: fade back in
        Animated.timing(iconOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [iconOpacity]);

  useFocusEffect(
    React.useCallback(() => {
      const fetchBars = async () => {
        const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
        setBars(storedBars);
      };
      fetchBars();
    }, [])
  );

  const handleColorChange = async () => {
    const updatedBars = bars.map(bar =>
      bar.name === selectedBar.name
        ? { ...bar, color: pickedColor, textColor: getContrastingTextColor(pickedColor) }
        : bar
    );
    setBars(updatedBars);
    await AsyncStorage.setItem('bars', JSON.stringify(updatedBars));
    setIsColorPickerVisible(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => setSelectedBar(null));
  };

  const handlePress = async (bar) => {
    // Store last opened time
    const updatedBars = bars.map(b =>
      b.name === bar.name ? { ...b, lastOpened: new Date().toISOString() } : b
    );
    setBars(updatedBars);
    await AsyncStorage.setItem('bars', JSON.stringify(updatedBars));

    // Navigate to BarDetailScreen
    navigation.navigate('BarDetail', { bar });
  };

  const handleColorPickerPress = (bar) => {
    setSelectedBar(bar);
    setPickedColor(bar.color || '#FFFFFF');
    setTextColor(getContrastingTextColor(bar.color || '#FFFFFF'));
    setIsColorPickerVisible(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const getContrastingTextColor = (backgroundColor) => {
    const rgb = hexToRgb(backgroundColor);
    const luminance = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    return luminance < 128 ? '#FFFFFF' : '#000000';
  };

  const hexToRgb = (hex) => {
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255,
    };
  };

  const animatedStyle = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-300, -75],
        }),
      },
    ],
    alignSelf: 'center',
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.backgroundVariant, padding: 20 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text h4 style={{ color: theme.colors.text }}>ViewBars</Text>
        {!isColorPickerVisible && (
          <Switch
            value={theme.dark}
            onValueChange={toggleTheme}
          />
        )}
      </View>

      {selectedBar ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: '20%',
              width: '90%',
              zIndex: 2,
              padding: 15,
              borderRadius: 8,
              shadowColor: theme.colors.shadow,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
              backgroundColor: pickedColor,
            },
            animatedStyle,
          ]}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center', color: textColor }}>
            {selectedBar.name}
          </Text>
        </Animated.View>
      ) : (
        <View style={{ flex: 1, }}>
          <DraggableFlatList
            data={bars}
            keyExtractor={(item, index) => index.toString()}
            onDragEnd={async ({ data }) => {
              setBars(data);
              await AsyncStorage.setItem('bars', JSON.stringify(data));
            }}
            renderItem={({ item, drag, index }) => {
              const itemTextColor = getContrastingTextColor(item.color || theme.colors.surfaceVariant);

              const lastOpenedDate = item.lastOpened ? new Date(item.lastOpened) : null;
              const now = new Date();
              const timeDifference = lastOpenedDate ? Math.abs(now - lastOpenedDate) / 60000 : null; // Difference in minutes

              const lastOpenedTime = lastOpenedDate
                  ? lastOpenedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'never';

              const isDanger = timeDifference && timeDifference >= 30;

              return (
                <TouchableOpacity
                  style={{
                    backgroundColor: item.color || theme.colors.surfaceVariant,
                    padding: 25,
                    borderRadius: 8,
                    shadowColor: theme.colors.shadow,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 5,
                    marginBottom: index === bars.length - 1 ? 0 : 20,
                    elevation: 2,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                  onLongPress={drag} // Enable dragging on long press
                  onPress={() => handlePress(item)}
                >
                  <View>
                    <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: itemTextColor }}>
                      {item.name}
                    </Text>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                      {isDanger && (
                        <Animated.View style={{ opacity: iconOpacity }}>
                          <MaterialIcons 
                            name="warning" 
                            size={18} 
                            color={getContrastingTextColor(item.color || '#FF0000')}
                            style={{ marginRight: 5 }} 
                          />
                        </Animated.View>
                      )}
                      <Text
                        style={{
                          fontSize: 14,
                          color: itemTextColor,
                        }}
                      > 
                        Last opened: {lastOpenedTime}
                      </Text>
                    </View>
                  </View>
                  <Button
                    icon={<Icon name="palette" color={getContrastingTextColor(item.color || theme.colors.surfaceVariant)} />}
                    buttonStyle={{
                      backgroundColor: item.color || 'transparent',
                      borderRadius: 10,
                      borderColor: getContrastingTextColor(item.color || theme.colors.surfaceVariant),
                    }}
                    onPress={() => handleColorPickerPress(item)}
                  />
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        </View>
      )}

      {isColorPickerVisible && (
        <View
          style={{
            position: 'absolute',
            right: 20,
            bottom: 0,
            width: '100%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: theme.colors.surface,
            paddingHorizontal: 20,
            paddingBottom: 130,
            alignItems: 'center',
            zIndex: 1,
          }}
        >
          <Text h4 style={{ textAlign: 'center', color: theme.colors.text }}>
            Pick a Color
          </Text>

          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <WheelColorPicker
              color={pickedColor}
              onColorChange={(color) => {
                setPickedColor(color);
                setTextColor(getContrastingTextColor(color));
              }}
              thumbStyle={{ height: 30, width: 30, backgroundColor: 'white' }}
              style={{ width: 300, height: 300 }}
            />
          </View>

          <Button
            title="Confirm"
            buttonStyle={{
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              width: '80%',
              padding: 15,
            }}
            titleStyle={{ textAlign: 'center', width: '100%' }}
            onPress={handleColorChange}
          />
        </View>
      )}

      {!isColorPickerVisible && (
        <View style={{ zIndex: 3, position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <Button
            title="Manage Bars"
            buttonStyle={{
              backgroundColor: "#00796b",
              borderRadius: 10,
              padding: 15,
            }}
            onPress={() => navigation.navigate('ManageBars')}
          />
        </View>
      )}
    </View>
  );
};

export default ViewBarsScreen;
