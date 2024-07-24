import React, { useState } from 'react';
import { View, Text, Button, TextInput, StyleSheet } from 'react-native';

const BarSelectionScreen = ({ navigation }) => {
  const [bars, setBars] = useState([]);
  const [barName, setBarName] = useState('');

  const addBar = () => {
    if (barName.trim() !== '') {
      setBars([...bars, barName]);
      setBarName('');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bar Selection</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter Bar Name"
        value={barName}
        onChangeText={setBarName}
      />
      <Button title="Add Bar" onPress={addBar} />
      {bars.map((bar, index) => (
        <Button
          key={index}
          title={bar}
          onPress={() => navigation.navigate('BarStack', { barName: bar })}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 16,
    padding: 8,
  },
});

export default BarSelectionScreen;
