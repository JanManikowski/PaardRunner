import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Animated } from 'react-native';
import { Text, Button, Icon } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DraggableFlatList from 'react-native-draggable-flatlist';
import WheelColorPicker from 'react-native-wheel-color-picker';

const ViewBarsScreen = ({ navigation }) => {
  const [bars, setBars] = useState([]);
  const [selectedBar, setSelectedBar] = useState(null);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [pickedColor, setPickedColor] = useState('#FFFFFF');
  const [animatedValue] = useState(new Animated.Value(0));

  useEffect(() => {
    const fetchBars = async () => {
      const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      setBars(storedBars);
    };    

    fetchBars();
  }, []);

  const handleColorChange = async () => {
    const updatedBars = bars.map(bar =>
      bar.name === selectedBar.name ? { ...bar, color: pickedColor } : bar
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
    setIsColorPickerVisible(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const animatedStyle = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [-300, -75], // Starts from -300 (off-screen top) to -75 (slightly above bottom)
        }),
      },
    ],
    alignSelf: 'center',
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8', padding: 20 }}>
      {selectedBar ? (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: '20%',
              width: '90%',
              zIndex: 2, // Ensure this view has a lower zIndex than the button
              padding: 15,
              borderRadius: 8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
              backgroundColor: pickedColor, // Change color dynamically
            },
            animatedStyle,
          ]}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, textAlign: 'center' }}>
            {selectedBar.name}
          </Text>
          <Text style={{ marginBottom: 5, fontSize: 16, textAlign: 'center' }}>
            Shelves: {selectedBar.numShelves}
          </Text>
          <Text style={{ fontSize: 16, textAlign: 'center' }}>
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
                  backgroundColor: item.color || '#FFF',
                  padding: 15,
                  borderRadius: 8,
                  shadowColor: '#000',
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
                  <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>
                    {item.name}
                  </Text>
                  <Text style={{ marginBottom: 5, fontSize: 16 }}>
                    Shelves: {item.numShelves}
                  </Text>
                  <Text style={{ fontSize: 16 }}>Fridges: {item.numFridges}</Text>
                </View>
                <Button
                  icon={<Icon name="palette" color="white" />}
                  buttonStyle={{
                    backgroundColor: item.color || '#00796b',
                    borderRadius: 10,
                  }}
                  onPress={() => handleBarPress(item)}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 80 }} // Adjusted padding for the button
          />
        </View>
      )}
  
      {isColorPickerVisible && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            width: '100%',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            backgroundColor: '#FFF',
            padding: 20,
            alignItems: 'center',
            zIndex: 1, // Lower zIndex to keep the button on top
          }}
        >
          <Text h4 style={{ marginBottom: 20, textAlign: 'center' }}>
            Pick a Color
          </Text>
          <WheelColorPicker
            initialColor={pickedColor}
            onColorChange={(color) => setPickedColor(color)}
            thumbStyle={{ height: 30, width: 30 }}
          />
          <Button
            title="Confirm"
            buttonStyle={{
              backgroundColor: pickedColor,
              marginTop: 20,
              borderRadius: 10,
              width: '80%',
            }}
            onPress={handleColorChange}
          />
        </View>
      )}
  
      {/* "Manage Bars" button is visible at all times, at the bottom */}
      <View style={{ zIndex: 3, position: 'absolute', bottom: 20, left: 20, right: 20 }}>
        <Button
          title="Manage Bars"
          buttonStyle={{
            backgroundColor: '#00796b',
            borderRadius: 10,
            padding: 15,
          }}
          onPress={() => navigation.navigate('ManageBars')}
        />
      </View>
    </View>
  );  
};

export default ViewBarsScreen;
