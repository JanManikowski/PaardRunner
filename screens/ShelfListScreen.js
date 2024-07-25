// ShelfListScreen.js
import React, { useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { FridgeContext } from '../contexts/FridgeContext';

const ShelfListScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barShelves } = useContext(FridgeContext);
  const shelves = barShelves[bar.name] || [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shelves in {bar.name}</Text>
      <ScrollView>
        {shelves.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.itemContainer}
            onPress={() => navigation.navigate('ShelfDetail', { barName: bar.name, shelfIndex: index })}
          >
            <Text style={styles.itemText}>{item.type}</Text>
            <Text style={styles.missingText}>{item.missing > 0 ? `${item.missing} missing` : ''}</Text>
          </TouchableOpacity>
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
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemText: {
    fontSize: 18,
  },
  missingText: {
    fontSize: 16,
    color: 'red',
  },
});

export default ShelfListScreen;
