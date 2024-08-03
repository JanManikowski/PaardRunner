import React, { useState, useContext, useEffect } from 'react';
import { ScrollView, View, Image } from 'react-native';
import { Text, Button, Input, Icon } from 'react-native-elements';
import { FridgeContext } from '../contexts/FridgeContext';
import { saveData, getData } from '../storage/AsyncStorageHelper';

const ShelfDetailScreen = ({ route, navigation }) => {
  const { barName, shelfIndex } = route.params;
  const { barShelves, setBarShelves, saveBarShelves, maxAmounts } = useContext(FridgeContext);
  const barShelf = barShelves[barName] || [];
  const shelf = barShelf[shelfIndex];
  const [missing, setMissing] = useState(shelf.missing);
  const [customValue, setCustomValue] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const savedMissing = await getData(`shelf_${barName}_${shelfIndex}`);
      if (savedMissing !== null) {
        setMissing(savedMissing);
      }
    };
    loadData();
  }, [barName, shelfIndex]);

  useEffect(() => {
    const saveMissing = async () => {
      await saveData(`shelf_${barName}_${shelfIndex}`, missing);
    };
    saveMissing();

    const updatedBarShelves = { ...barShelves };
    updatedBarShelves[barName][shelfIndex] = { ...shelf, missing };
    saveBarShelves(updatedBarShelves);
  }, [missing]);

  const updateMissing = (value) => {
    const maxAmount = maxAmounts[barName][shelf.type] || shelf.depth; // default to shelf depth if maxAmounts not found
    const newMissing = Math.max(0, Math.min(missing + value, maxAmount));
    setMissing(newMissing);
  };

  const handleCustomValue = (isAdd) => {
    const value = parseInt(customValue, 10);
    if (!isNaN(value)) {
      updateMissing(isAdd ? value : -value);
      setCustomValue(''); // Clear custom value after use
    }
  };

  const clearMissing = () => {
    setMissing(0);
  };

  const goToNextItem = () => {
    if (shelfIndex < barShelf.length - 1) {
      navigation.replace('ShelfDetail', {
        barName,
        shelfIndex: shelfIndex + 1,
      });
    }
  };

  const goToPreviousItem = () => {
    if (shelfIndex > 0) {
      navigation.replace('ShelfDetail', {
        barName,
        shelfIndex: shelfIndex - 1,
      });
    }
  };

  const getImageSource = (type) => {
    switch (type) {
      case '7up':
        return require('../assets/7up.jpeg');
      case 'Sisi':
        return require('../assets/sisi.jpg');
      case 'Tonic':
        return require('../assets/tonic.jpg');
      case 'Icetea Green':
        return require('../assets/icetea.jpg');
      case 'Apple juice':
        return require('../assets/appelsap.jpeg');
      case 'Orange juice':
        return require('../assets/orange.png');
      case 'Cassis':
        return require('../assets/cassis.jpg');
      case 'Bitter lemon':
        return require('../assets/bitterlemon.jpeg');
      case 'White wine':
        return require('../assets/placeholder.jpg');
      case 'Rose':
        return require('../assets/placeholder.jpg');
      case 'Sweet wine':
        return require('../assets/placeholder.jpg');
      case 'Ginger beer':
        return require('../assets/placeholder.jpg');
      case 'Ginger ale':
        return require('../assets/placeholder.jpg');
      default:
        return require('../assets/placeholder.jpg'); // Default placeholder image
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: '#F0F0F0' }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }}>
        <Button
          icon={<Icon name="arrow-back" size={30} color={shelfIndex === 0 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToPreviousItem}
          disabled={shelfIndex === 0}
        />
        <Button
          icon={<Icon name="arrow-forward" size={30} color={shelfIndex === barShelf.length - 1 ? '#ccc' : '#00796b'} />}
          type="clear"
          onPress={goToNextItem}
          disabled={shelfIndex === barShelf.length - 1}
        />
      </View>
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        <Text h4 style={{ color: '#004d40', marginBottom: 10 }}>{shelf.type}</Text>
        <Text style={{ fontSize: 16, color: '#00796b' }}>Total Items: {shelf.depth}</Text>
        <Text style={{ fontSize: 16, color: '#d32f2f' }}>Missing Items: {missing}</Text>
        <Text style={{ fontSize: 16, color: '#555' }}>Max Allowed: {maxAmounts[barName][shelf.type] || shelf.depth}</Text>
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
            buttonStyle={{ backgroundColor: '#F44336', borderRadius: 10 }}
            onPress={() => updateMissing(-5)}
            containerStyle={{ width: 60 }}
          />
        </View>
        <Image
          source={getImageSource(shelf.type)}
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

export default ShelfDetailScreen;
