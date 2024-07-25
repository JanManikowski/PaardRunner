import React, { useContext, useState, useCallback } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect } from '@react-navigation/native';
import { FridgeContext } from '../contexts/FridgeContext';
import { getData } from '../storage/AsyncStorageHelper';

const MissingItemsScreen = ({ route }) => {
  const { bar } = route.params;
  const { barFridges, barShelves } = useContext(FridgeContext);
  const [missingItems, setMissingItems] = useState([]);

  const fetchMissingItems = async () => {
    let items = [];

    if (barFridges[bar.name]) {
      const fridges = await Promise.all(
        barFridges[bar.name].map(async (fridge, index) => {
          const savedMissing = await getData(`fridge_${bar.name}_${index}`);
          return { ...fridge, missing: savedMissing !== null ? savedMissing : fridge.missing };
        })
      );
      fridges.forEach(item => {
        if (item.missing > 0) {
          items.push({ ...item, bar: bar.name });
        }
      });
    }

    if (barShelves[bar.name]) {
      const shelves = await Promise.all(
        barShelves[bar.name].map(async (shelf, index) => {
          const savedMissing = await getData(`shelf_${bar.name}_${index}`);
          return { ...shelf, missing: savedMissing !== null ? savedMissing : shelf.missing };
        })
      );
      shelves.forEach(item => {
        if (item.missing > 0) {
          items.push({ ...item, bar: bar.name });
        }
      });
    }

    setMissingItems(items);
  };

  useFocusEffect(
    useCallback(() => {
      fetchMissingItems();
    }, [bar.name])
  );

  const generateMissingItemsMessage = () => {
    const header = `*${bar.name} is missing these items:*\n\n`;

    // Calculate the maximum length of the item names and missing counts
    const maxTypeLength = Math.max(...missingItems.map(item => item.type.length));
    const maxMissingLength = Math.max(...missingItems.map(item => String(item.missing).length));

    // Format the list with aligned quantities using monospaced formatting
    const list = missingItems
      .map(item => {
        const paddedType = item.type.padEnd(maxTypeLength, ' ');
        const paddedMissing = String(item.missing).padStart(maxMissingLength, ' ');
        return `- ${paddedType} : ${paddedMissing}`;
      })
      .join('\n');

    return `${header}\`\`\`\n${list}\n\`\`\``;
  };

  const copyToClipboard = () => {
    const message = generateMissingItemsMessage();
    Clipboard.setString(message);
    alert('Copied to clipboard!');
  };

  const shareList = async () => {
    const message = generateMissingItemsMessage();
    try {
      await Share.share({
        message: message,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Missing Items for {bar.name}</Text>
      <ScrollView>
        {missingItems.map((item, index) => (
          <Text key={index} style={styles.itemText}>{`${item.type}: ${item.missing}`}</Text>
        ))}
      </ScrollView>
      <Button title="Copy to Clipboard" onPress={copyToClipboard} />
      <Button title="Share List" onPress={shareList} />
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
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    marginBottom: 10,
  },
});

export default MissingItemsScreen;
