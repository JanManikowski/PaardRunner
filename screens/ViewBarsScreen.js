import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Text, Button } from 'react-native-elements';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ColorPicker from 'react-native-wheel-color-picker';

const ViewBarsScreen = ({ navigation, route }) => {
  const [bars, setBars] = useState([]);
  const [selectedBar, setSelectedBar] = useState(null);
  const [isColorPickerVisible, setIsColorPickerVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#FFF'); // Default color
  const [textColor, setTextColor] = useState('#000'); // Default text color

  useEffect(() => {
    fetchBars();
  }, [route.params?.refresh]);

  const fetchBars = async () => {
    const storedBars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
    setBars(storedBars);
  };

  const handleLongPress = (item) => {
    setSelectedBar(item);
    setSelectedColor(item.color || '#FFF'); // Set the color picker to the current color of the bar
    setTextColor(getTextColor(item.color || '#FFF')); // Set the text color based on the current color
    setIsColorPickerVisible(true);
  };

  const handleColorChange = (color) => {
    setSelectedColor(color);
    setTextColor(getTextColor(color)); // Update the text color based on the new color
  };

  const confirmColorChange = async () => {
    const updatedBars = bars.map(bar =>
      bar.name === selectedBar.name ? { ...bar, color: selectedColor } : bar
    );
    setBars(updatedBars);
    await AsyncStorage.setItem('bars', JSON.stringify(updatedBars));
    setIsColorPickerVisible(false);
  };

  const getTextColor = (backgroundColor) => {
    // Convert hex to RGB
    const rgb = parseInt(backgroundColor.slice(1), 16); 
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    // Calculate luminance
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Return white text color for dark backgrounds, black for light
    return luminance < 128 ? '#FFF' : '#000';
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F8F8', padding: 20 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, marginBottom: 20 }}>
        <Text h4 h4Style={{ fontSize: 24, fontWeight: 'bold' }}>Stored Bars</Text>
      </View>
      <FlatList
        data={bars}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={{
              backgroundColor: item.color || '#FFF',
              padding: 15,
              borderRadius: 8,
              marginBottom: 20
            }}
            onPress={() => navigation.navigate('BarDetail', { bar: item })}
            onLongPress={() => handleLongPress(item)}
          >
            <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: getTextColor(item.color || '#FFF') }}>{item.name}</Text>
            <Text style={{ marginBottom: 5, fontSize: 16, color: getTextColor(item.color || '#FFF') }}>Shelves: {item.numShelves}</Text>
            <Text style={{ fontSize: 16, color: getTextColor(item.color || '#FFF') }}>Fridges: {item.numFridges}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={{ backgroundColor: '#FFF', padding: 15, borderRadius: 8, marginTop: 20 }} onPress={() => navigation.navigate('ManageBars')}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>Manage Bars</Text>
      </TouchableOpacity>

      <Modal visible={isColorPickerVisible} transparent={true} animationType="slide">
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: '#FFF', padding: 20, borderRadius: 10 }}>
            <Text h4 h4Style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Select a Color</Text>
            <ColorPicker
              color={selectedColor}
              onColorChange={handleColorChange}
              style={{ width: 300, height: 300 }}
            />
            <Button
              title="Confirm"
              onPress={confirmColorChange}
              buttonStyle={{ marginTop: 20 }}
            />
            <TouchableOpacity onPress={() => setIsColorPickerVisible(false)} style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'center' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ViewBarsScreen;
