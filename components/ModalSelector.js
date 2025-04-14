import React, { useContext } from 'react';
import { Modal, View, FlatList, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

const ModalSelector = ({ visible, items, selectedId, activeId, onSelect, onSetActive, onClose }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.title, { color: theme.colors.onSurface }]}>Choose an Organization</Text>
          <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.item,
                  { backgroundColor: item.id === selectedId ? theme.colors.primary : theme.colors.surfaceVariant },
                  item.id === activeId,
                ]}
                onPress={() => onSelect(item.id)}
              >
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemText,
                      { color: item.id === selectedId ? theme.colors.onPrimary : theme.colors.onSurface },
                    ]}
                  >
                    {item.name}
                  </Text>
                  {item.id === activeId && (
                    <View
                      style={[
                        styles.activeBadgeContainer,
                        { backgroundColor: theme.colors.primaryContainer },
                      ]}
                    >
                      <Text style={[styles.activeBadge, { color: theme.colors.onPrimaryContainer }]}>Active</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={[
              styles.button,
              !selectedId || selectedId === activeId ? styles.buttonDisabled : { backgroundColor: theme.colors.primary },
            ]}
            onPress={() => {
              if (selectedId === activeId) {
                Alert.alert('Notice', 'This organization is already active.');
              } else {
                onSetActive(selectedId);
              }
            }}
            disabled={!selectedId || selectedId === activeId}
          >
            <Text style={[styles.buttonText, { color: theme.colors.onPrimary }]}>Set Active Organization</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={[styles.closeButtonText, { color: theme.colors.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  item: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    position: 'relative',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between', // Ensures consistent spacing between text and badge
  },
  itemText: {
    fontSize: 16,
    flex: 1, // Takes up available space
  },
  activeBadgeContainer: {
    marginLeft: 10, // Adds spacing from text
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  activeBadge: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(211, 211, 211, 0.8)', // Light gray for disabled state
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
  },
});

export default ModalSelector;
