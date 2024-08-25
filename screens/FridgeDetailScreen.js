import React, { useState, useContext, useEffect } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { Text, Button, Input, Icon } from 'react-native-elements';
import { FridgeContext } from '../contexts/FridgeContext';
import { saveData, getData } from '../storage/AsyncStorageHelper';

const FridgeDetailScreen = ({ route, navigation }) => {
  const { barName, fridgeIndex: initialFridgeIndex } = route.params;
  const { barFridges, setBarFridges, saveBarFridges, maxAmounts } = useContext(FridgeContext);
  const [fridgeIndex, setFridgeIndex] = useState(initialFridgeIndex);
  const [fridge, setFridge] = useState(barFridges[barName][initialFridgeIndex]);
  const [missing, setMissing] = useState(fridge.missing);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    // Fetch the correct fridge and missing data on fridgeIndex change
    const loadData = async () => {
      const currentFridge = barFridges[barName][fridgeIndex];
      const savedMissing = await getData(`fridge_${barName}_${fridgeIndex}`);
      
      setFridge(currentFridge); // Update the fridge to the current one
      if (savedMissing !== null) {
        setMissing(savedMissing);
      } else {
        setMissing(currentFridge.missing);
      }
    };

    loadData();
  }, [fridgeIndex, barFridges, barName]);

  useEffect(() => {
    // Save the missing data whenever it changes
    const saveMissing = async () => {
      await saveData(`fridge_${barName}_${fridgeIndex}`, missing);
    };
    saveMissing();

    const updatedBarFridges = { ...barFridges };
    updatedBarFridges[barName][fridgeIndex] = { ...fridge, missing };
    saveBarFridges(updatedBarFridges);
  }, [missing]);

  const updateMissing = (value) => {
    setMissing(prevMissing => {
      const newMissing = Math.max(0, Math.min(prevMissing + value, maxAmounts[barName][fridge.type]));
      return newMissing;
    });
  };

  const handleCustomValue = (isAdd) => {
    const value = parseInt(customValue, 10);
    if (!isNaN(value)) {
      updateMissing(isAdd ? value : -value);
    }
  };

  const clearMissing = () => {
    setMissing(0);
  };

  const goToNextItem = () => {
    if (fridgeIndex < barFridges[barName].length - 1) {
      setFridgeIndex(fridgeIndex + 1);
    }
  };

  const goToPreviousItem = () => {
    if (fridgeIndex > 0) {
      setFridgeIndex(fridgeIndex - 1);
    }
  };

  const getImageSource = (type) => {
    switch (type) {
      case 'Spa Blauw':
        return require('../assets/fridge/spa_blauw.jpg');
      case 'Grolsch 0.0':
        return require('../assets/fridge/0.0.png');
      case 'Grimbergen':
        return require('../assets/fridge/grimbergen.jpg');
      case 'Radler':
        return require('../assets/fridge/radler.png');
      case 'Spa Rood':
        return require('../assets/fridge/sparood.jpg');
      case 'Weizen 0.0':
        return require('../assets/fridge/weizen.jpeg');
      case 'Bok':
        return require('../assets/fridge/bok.png');
      case 'IPA':
        return require('../assets/fridge/ipa.png');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F0F0F0' }}>
      {/* Arrow Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button
          icon={<Icon name="arrow-back" size={30} color={fridgeIndex === 0 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToPreviousItem}
          disabled={fridgeIndex === 0}
        />
        <Button
          icon={<Icon name="arrow-forward" size={30} color={fridgeIndex === barFridges[barName].length - 1 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToNextItem}
          disabled={fridgeIndex === barFridges[barName].length - 1}
        />
      </View>

      {/* Fridge Details */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text h4 style={{ color: '#004d40', marginBottom: 10 }}>{fridge.type}</Text>
        <Text style={{ fontSize: 16, color: '#d32f2f', fontWeight: "bold" }}>Missing Items: {missing}</Text>
        <Text style={{ fontSize: 16, color: '#555' }}>Max Allowed: {maxAmounts[barName][fridge.type]}</Text>
      </View>

      {/* Update Buttons */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
        <View style={{ justifyContent: 'space-between', height: 120 }}>
          <Button
            title="-1"
            buttonStyle={{ backgroundColor: '#F44336', borderRadius: 10 }}
            onPress={() => updateMissing(-1)}
            containerStyle={{ width: 60, marginBottom: 10 }}
          />
          <Button
            title="-5"
            buttonStyle={{ backgroundColor: '#F44336', borderRadius: 10 }}
            onPress={() => updateMissing(-5)}
            containerStyle={{ width: 60 }}
          />
        </View>
        <Image
          source={getImageSource(fridge.type)}
          style={{ width: 150, height: 150, marginHorizontal: 20, borderRadius: 10, backgroundColor: "white" }}
        />
        <View style={{ justifyContent: 'space-between', height: 120 }}>
          <Button
            title="+1"
            buttonStyle={{ backgroundColor: '#4CAF50', borderRadius: 10 }}
            onPress={() => updateMissing(1)}
            containerStyle={{ width: 60, marginBottom: 10 }}
          />
          <Button
            title="+5"
            buttonStyle={{ backgroundColor: '#4CAF50', borderRadius: 10 }}
            onPress={() => updateMissing(5)}
            containerStyle={{ width: 60 }}
          />
        </View>
      </View>

      <Input
        placeholder="Custom value"
        keyboardType="numeric"
        value={customValue}
        onChangeText={setCustomValue}
        containerStyle={{ marginBottom: 20, width: '80%', alignSelf: 'center' }}
        inputStyle={{ textAlign: 'center' }}
      />

      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 20 }}>
        <Button
          title="Retract Value"
          buttonStyle={{ backgroundColor: '#228B22', borderRadius: 10 }}
          containerStyle={{ flex: 1, marginRight: 10 }}
          onPress={() => handleCustomValue(false)}
        />
        <Button
          title="Add Value"
          buttonStyle={{ backgroundColor: '#228B22', borderRadius: 10 }}
          containerStyle={{ flex: 1, marginLeft: 10 }}
          onPress={() => handleCustomValue(true)}
        />
      </View>

      <Button
        title="Clear Missing Items"
        buttonStyle={{ backgroundColor: '#B22222', borderRadius: 10, paddingHorizontal: 20 }}
        titleStyle={{ fontSize: 18, fontWeight: 'bold' }}
        onPress={clearMissing}
        containerStyle={{ alignItems: 'center' }}
      />
      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 20 }}>
        {/* Other buttons */}
        <Button
          title="Go to Shelves"
          buttonStyle={{ backgroundColor: '#00796b', borderRadius: 10 }}
          onPress={() => navigation.navigate('ShelfList', { bar: { name: barName } })}
        />
    </View>
  </View>
  );
};

export default FridgeDetailScreen;
