import React, { useState, useContext, useEffect } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { Text, Button, Input, Icon } from 'react-native-elements';
import { FridgeContext } from '../contexts/FridgeContext';
import { saveData, getData } from '../storage/AsyncStorageHelper';

const FridgeDetailScreen = ({ route, navigation }) => {
  const { barName, fridgeIndex } = route.params;
  const { barFridges, setBarFridges, saveBarFridges, maxAmounts } = useContext(FridgeContext);
  const barFridge = barFridges[barName] || [];
  const fridge = barFridge[fridgeIndex];
  const [missing, setMissing] = useState(fridge.missing);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const savedMissing = await getData(`fridge_${barName}_${fridgeIndex}`);
      if (savedMissing !== null) {
        setMissing(savedMissing);
      }
    };
    loadData();
  }, [barName, fridgeIndex]);

  useEffect(() => {
    const saveMissing = async () => {
      await saveData(`fridge_${barName}_${fridgeIndex}`, missing);
    };
    saveMissing();

    const updatedBarFridges = { ...barFridges };
    updatedBarFridges[barName][fridgeIndex] = { ...fridge, missing };
    saveBarFridges(updatedBarFridges);
  }, [missing]);

  const updateMissing = (value) => {
    const newMissing = Math.max(0, Math.min(missing + value, maxAmounts[barName][fridge.type]));
    setMissing(newMissing);
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
    if (fridgeIndex < barFridge.length - 1) {
      navigation.replace('FridgeDetail', {
        barName,
        fridgeIndex: fridgeIndex + 1,
      });
    }
  };

  const goToPreviousItem = () => {
    if (fridgeIndex > 0) {
      navigation.replace('FridgeDetail', {
        barName,
        fridgeIndex: fridgeIndex - 1,
      });
    }
  };

  const getImageSource = (type) => {
    switch (type) {
      case 'Spa Blauw':
        return require('../assets/spa_blauw.jpg');
      case 'Grolsch 0.0':
        return require('../assets/0.0.png');
      case 'Grimbergen':
        return require('../assets/grimbergen.jpg');
      case 'Radler':
        return require('../assets/radler.png');
      case 'Spa Rood':
        return require('../assets/sparood.jpg');
      case 'Weizen 0.0':
        return require('../assets/weizen.jpeg');
      case 'Bok':
        return require('../assets/bok.png');
      case 'IPA':
        return require('../assets/ipa.png');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F0F0F0' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button
          icon={<Icon name="arrow-back" size={30} color={fridgeIndex === 0 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToPreviousItem}
          disabled={fridgeIndex === 0}
        />
        <Button
          icon={<Icon name="arrow-forward" size={30} color={fridgeIndex === barFridge.length - 1 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToNextItem}
          disabled={fridgeIndex === barFridge.length - 1}
        />
      </View>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text h4 style={{ color: '#004d40', marginBottom: 10 }}>{fridge.type}</Text>
        <Text style={{ fontSize: 16, color: '#d32f2f', fontWeight: "bold" }}>Missing Items: {missing}</Text>
        <Text style={{ fontSize: 16, color: '#555' }}>Max Allowed: {maxAmounts[barName][fridge.type]}</Text>
      </View>
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
            buttonStyle={{ backgroundColor: '#F44336', borderRadius: 10}}
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
    </View>
  );
};

export default FridgeDetailScreen;
