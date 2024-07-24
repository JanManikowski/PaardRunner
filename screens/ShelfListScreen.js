import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const ShelfListScreen = ({ route }) => {
  const { inventory } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shelf Items</Text>
      <ScrollView>
        {inventory.shelves.map((item, index) => (
          <Text key={index} style={styles.itemText}>{item.type}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  itemText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

export default ShelfListScreen;
