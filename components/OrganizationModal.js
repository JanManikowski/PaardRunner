import React from 'react';
import { Modal, View, FlatList, Text, TouchableOpacity, StyleSheet } from 'react-native';

const OrganizationModal = ({
  visible,
  onClose,
  organizations,
  selectedOrgId,
  setSelectedOrgId,
  onConfirm,
  theme,
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={styles.modalBackground}>
      <View style={[styles.modalContent, { backgroundColor: theme.colors.card }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Select Active Organization:</Text>
        <FlatList
          data={organizations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.orgItem,
                { backgroundColor: item.id === selectedOrgId ? theme.colors.primary : theme.colors.card },
              ]}
              onPress={() => setSelectedOrgId(item.id)}
            >
              <Text style={{ color: theme.colors.text }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
        <CustomButton
          onPress={onConfirm}
          label="Set Active Organization"
          backgroundColor={theme.colors.primary}
          textColor={theme.colors.background}
          disabled={!selectedOrgId}
        />
        <CustomButton
          onPress={onClose}
          label="Cancel"
          backgroundColor="transparent"
          textColor={theme.colors.primary}
        />
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    marginBottom: 20,
  },
  orgItem: {
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
});

export default OrganizationModal;
