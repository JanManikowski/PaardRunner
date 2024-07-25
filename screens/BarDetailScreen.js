import React, { useState, useContext, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Modal, ScrollView } from 'react-native';
import { FridgeContext } from '../contexts/FridgeContext';

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { barFridges, setBarFridges, barShelves, setBarShelves } = useContext(FridgeContext);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!barFridges[bar.name]) {
      const initialFridges = [
        { type: 'Spa blauw', rows: 7, depth: 5, missing: 0 },
        { type: '0.0', rows: 3, depth: 6, missing: 0 },
        { type: 'Grimbergen', rows: 3, depth: 6, missing: 0 },
        { type: 'Radler', rows: 2, depth: 6, missing: 0 },
        { type: 'Spa rood', rows: 4, depth: 6, missing: 0 },
        { type: 'Weizen 0.0', rows: 2, depth: 6, missing: 0 },
        { type: 'Bok', rows: 1, depth: 6, missing: 0 },
        { type: 'IPA', rows: 2, depth: 6, missing: 0 },
      ];
      setBarFridges(prev => ({ ...prev, [bar.name]: initialFridges }));
    }
  }, [bar.name, barFridges, setBarFridges]);

  useEffect(() => {
    if (!barShelves[bar.name]) {
      const initialShelves = [
        { type: '7up', rows: 1, depth: 4, missing: 0 },
        { type: 'Sisi', rows: 1, depth: 4, missing: 0 },
        { type: 'Tonic', rows: 1, depth: 4, missing: 0 },
        { type: 'Sprite', rows: 1, depth: 4, missing: 0 },
        { type: 'Apple Juice', rows: 1, depth: 2, missing: 0 },
        { type: 'Orange Juice', rows: 1, depth: 2, missing: 0 },
        { type: 'Cassis', rows: 1, depth: 2, missing: 0 },
        { type: 'Bitter Lemon', rows: 1, depth: 2, missing: 0 },
        { type: 'White Wine', rows: 2, depth: 4, missing: 0 },
        { type: 'Rose', rows: 1, depth: 4, missing: 0 },
        { type: 'Sweet Wine', rows: 1, depth: 4, missing: 0 },
        { type: 'Ginger Beer', rows: 1, depth: 4, missing: 0 },
        { type: 'Ginger Ale', rows: 1, depth: 4, missing: 0 },
      ];
      setBarShelves(prev => ({ ...prev, [bar.name]: initialShelves }));
    }
  }, [bar.name, barShelves, setBarShelves]);

  const getTotalMissingItems = () => {
    const fridgeItems = (barFridges[bar.name] || []).filter(item => item.missing > 0);
    const shelfItems = (barShelves[bar.name] || []).filter(item => item.missing > 0);
    return [...fridgeItems, ...shelfItems];
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{bar.name} Inventory</Text>
      <Button title="View Fridges" onPress={() => navigation.navigate('FridgeList', { bar })} />
      <Button title="View Shelves" onPress={() => navigation.navigate('ShelfList', { bar })} />
      <Button title="Show Missing Items" onPress={() => setModalVisible(true)} />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>Missing Items</Text>
            <ScrollView>
              {getTotalMissingItems().map((item, index) => (
                <Text key={index} style={styles.modalText}>{`${item.type}: ${item.missing} missing`}</Text>
              ))}
            </ScrollView>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
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
  button: {
    marginBottom: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
  },
});

export default BarDetailScreen;
