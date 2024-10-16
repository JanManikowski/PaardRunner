import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const ShelfDetailScreen = ({ route, navigation }) => {
  const { shelf, setShelves, index, shelves } = route.params;
  const [missing, setMissing] = useState(shelf.missing);
  const [customValue, setCustomValue] = useState('');

  const updateMissing = (value) => {
    const newMissing = Math.max(0, missing + value);
    setMissing(newMissing);
    setShelves((prevShelves) => {
      const updatedShelves = [...prevShelves];
      updatedShelves[index] = { ...updatedShelves[index], missing: newMissing };
      return updatedShelves;
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
    setShelves((prevShelves) => {
      const updatedShelves = [...prevShelves];
      updatedShelves[index] = { ...updatedShelves[index], missing: 0 };
      return updatedShelves;
    });
  };

  const goToNextItem = () => {
    if (index < shelves.length - 1) {
      const nextIndex = index + 1;
      navigation.replace('ShelfDetail', {
        shelf: shelves[nextIndex],
        setShelves,
        index: nextIndex,
        shelves,
      });
    }
  };

  const goToPreviousItem = () => {
    if (index > 0) {
      const prevIndex = index - 1;
      navigation.replace('ShelfDetail', {
        shelf: shelves[prevIndex],
        setShelves,
        index: prevIndex,
        shelves,
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
        return require('../assets/icetea.jpeg');
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
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.navigationContainer}>
        <TouchableOpacity onPress={goToPreviousItem} style={styles.arrowButton} disabled={index === 0}>
          <Icon name="arrow-back" size={30} color={index === 0 ? '#ccc' : '#000'} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToNextItem} style={styles.arrowButton} disabled={index === shelves.length - 1}>
          <Icon name="arrow-forward" size={30} color={index === shelves.length - 1 ? '#ccc' : '#000'} />
        </TouchableOpacity>
      </View>
      <Text style={styles.title}>{shelf.type} Details</Text>
      <Text>Total Items: {shelf.rows * shelf.depth}</Text>
      <Text>Missing Items: {missing}</Text>
      <View style={styles.buttonImageContainer}>
        <View style={styles.buttonColumn}>
          <Button title="-1" onPress={() => updateMissing(-1)} />
          <Button title="-5" onPress={() => updateMissing(-5)} />
        </View>
        <Image
          source={getImageSource(shelf.type)}
          style={styles.image}
        />
        <View style={styles.buttonColumn}>
          <Button title="+1" onPress={() => updateMissing(1)} />
          <Button title="+5" onPress={() => updateMissing(5)} />
        </View>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Custom value"
        keyboardType="numeric"
        value={customValue}
        onChangeText={setCustomValue}
      />
      <View style={styles.buttonContainer}>
        <Button title="Retract Custom Value" onPress={() => handleCustomValue(false)} />
        <Button title="Add Custom Value" onPress={() => handleCustomValue(true)} />
      </View>
      <TouchableOpacity style={styles.clearButton} onPress={clearMissing}>
        <Text style={styles.clearButtonText}>Clear Missing Items</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  arrowButton: {
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  buttonImageContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonColumn: {
    justifyContent: 'space-between',
    height: 120,
  },
  image: {
    width: 150,
    height: 150,
    marginHorizontal: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  clearButton: {
    marginTop: 20,
    paddingVertical: 15,
    paddingHorizontal: 30,
    backgroundColor: '#FF0000',
    borderRadius: 5,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ShelfDetailScreen;
