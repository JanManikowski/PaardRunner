import React from 'react';
import { Modal, View, FlatList, Text, TouchableOpacity, Alert } from 'react-native';

const ModalSelector = ({ visible, items, selectedId, activeId, onSelect, onSetActive, onClose }) => (
  <Modal visible={visible} transparent animationType="slide">
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <View style={{ width: '80%', backgroundColor: '#FFF', padding: 20, borderRadius: 10 }}>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                padding: 10,
                backgroundColor: item.id === selectedId ? '#007BFF' : '#F8F9FA',
                borderRadius: 5,
                marginBottom: 10,
              }}
              onPress={() => onSelect(item.id)}
            >
              <Text style={{ color: item.id === selectedId ? '#FFF' : '#000' }}>{item.name}</Text>
              {item.id === activeId && (
                <Text style={{ fontSize: 12, color: '#007BFF', marginTop: 5 }}>Active</Text>
              )}
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          style={{
            padding: 15,
            backgroundColor: selectedId === activeId ? '#d3d3d3' : '#007BFF',
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 10,
          }}
          onPress={() => {
            if (selectedId === activeId) {
              Alert.alert('Notice', 'This organization is already active.');
            } else {
              onSetActive(selectedId);
            }
          }}
          disabled={!selectedId || selectedId === activeId}
        >
          <Text style={{ color: '#FFF', fontSize: 16 }}>Set Active Organization</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onClose} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: '#007BFF', fontSize: 16 }}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default ModalSelector;
