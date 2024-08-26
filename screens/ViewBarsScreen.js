import React, { useState, useEffect, useContext } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text, Button, Icon, Switch } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import WheelColorPicker from 'react-native-wheel-color-picker';
import { ThemeContext } from '../contexts/ThemeContext';

const ViewBarsScreen = ({ navigation, route }) => {
  const [bars, setBars] = useState([]);
  const [selectedBar, setSelectedBar] = useState(null);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [pickedColor, setPickedColor] = useState('#FFFFFF');
  const [textColor, setTextColor] = useState('#000000'); // Default text color is black
  const [animatedValue] = useState(new Animated.Value(0));
  const { theme, toggleTheme } = useContext(ThemeContext);

  useEffect(() => {
    const fetchBars = async () => {
      const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      setBars(storedBars);
    };

    fetchBars();
  }, [route.params?.refresh]);

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
  


  const handleBarPress = (bar) => {
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 20 }}>
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
              backgroundColor: pickedColor, // White box now reflects the current pickedColor
            },
            animatedStyle,
          ]}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center', color: textColor }}>
            {selectedBar.name}
          </Text>
          <Text style={{ marginBottom: 5, fontSize: 16, textAlign: 'center', color: textColor }}>
            Shelves: {selectedBar.numShelves}
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center', color: textColor }}>
            Fridges: {selectedBar.numFridges}
          </Text>
        </Animated.View>
      ) : (
        <View style={{ flex: 1 }}>
          <DraggableFlatList
            data={bars}
            keyExtractor={(item, index) => index.toString()}
            onDragEnd={async ({ data }) => {
              setBars(data);
              await AsyncStorage.setItem('bars', JSON.stringify(data));
            }}
            renderItem={({ item, drag, index }) => (
              <TouchableOpacity
                style={{
                  backgroundColor: item.color || theme.colors.surfaceVariant, // Bar box color
                  padding: 15,
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
                }}
                onLongPress={drag}
                onPress={() => navigation.navigate('BarDetail', { bar: item })}
              >
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: textColor }}>
                    {item.name}
                  </Text>
                  <Text style={{ marginBottom: 5, fontSize: 16, color: textColor }}>
                    Shelves: {item.numShelves}
                  </Text>
                  <Text style={{ fontSize: 16, color: textColor }}>Fridges: {item.numFridges}</Text>
                </View>
                <Button
                  icon={<Icon name="palette" color="white" />}
                  buttonStyle={{
                    backgroundColor: item.color || 'transparent', // Match the box color or set to transparent
                    borderRadius: 10,
                  }}
                  onPress={() => handleBarPress(item)}
                />
              </TouchableOpacity>
            )}
            
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
              color={pickedColor}  // Use color prop instead of initialColor
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
  titleStyle={{ textAlign: 'center', width: '100%' }}  // Center the text
  onPress={handleColorChange}
/>
        </View>
      )}

      {!isColorPickerVisible && (
        <View style={{ zIndex: 3, position: 'absolute', bottom: 20, left: 20, right: 20 }}>
          <Button
            title="Manage Bars"
            buttonStyle={{
              backgroundColor: theme.colors.primary,
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
