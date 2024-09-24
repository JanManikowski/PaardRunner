import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { fetchUserOrganizations, createOrganization } from '../utils/firebaseService'; // Import Firebase functions

const AdminFeaturesScreen = ({ navigation }) => {
  const { theme } = React.useContext(ThemeContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [orgName, setOrgName] = useState('');

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      Alert.alert('Error', 'Please enter a valid organization name.');
      return;
    }
    try {
      await createOrganization(orgName, 'admin@example.com'); // Replace with real admin email
      Alert.alert('Success', `Organization "${orgName}" created successfully.`);
      setModalVisible(false);
      setOrgName('');
    } catch (error) {
      console.error('Error creating organization:', error);
      Alert.alert('Error', 'Failed to create organization.');
    }
  };

  const handleListOrganizations = async () => {
    try {
      const organizations = await fetchUserOrganizations();
      Alert.alert('Organizations', organizations.map(org => org.name).join('\n'));
    } catch (error) {
      console.error('Error fetching organizations:', error);
      Alert.alert('Error', 'Failed to load organizations.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: theme.colors.text }}>
        Admin Features
      </Text>

      {/* Export Data Button */}
      <TouchableOpacity
        style={buttonStyle(theme)}
        onPress={() => navigation.navigate('Settings', { exportData: true })} // Assumes exportData is in Settings
      >
        <Text style={buttonTextStyle(theme)}>Export Data</Text>
      </TouchableOpacity>

      {/* List Organizations Button */}
      <TouchableOpacity
        style={buttonStyle(theme)}
        onPress={handleListOrganizations}
      >
        <Text style={buttonTextStyle(theme)}>List Organizations</Text>
      </TouchableOpacity>

      {/* Add Organization Button */}
      <TouchableOpacity
        style={buttonStyle(theme)}
        onPress={() => setModalVisible(true)}
      >
        <Text style={buttonTextStyle(theme)}>Add Organization</Text>
      </TouchableOpacity>

      {/* Modal for Adding Organization */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
          <View style={{ backgroundColor: theme.colors.surface, padding: 20, borderRadius: 10 }}>
            <Text style={{ fontSize: 18, marginBottom: 10, color: theme.colors.text }}>Enter Organization Name:</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: theme.colors.border, padding: 10, marginBottom: 20, color: theme.colors.text }}
              placeholder="Organization Name"
              placeholderTextColor={theme.colors.placeholder}
              value={orgName}
              onChangeText={setOrgName}
            />
            <TouchableOpacity
              style={buttonStyle(theme)}
              onPress={handleCreateOrganization}
            >
              <Text style={buttonTextStyle(theme)}>Create Organization</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[buttonStyle(theme), { marginTop: 10, backgroundColor: theme.colors.error }]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={buttonTextStyle(theme)}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const buttonStyle = (theme) => ({
  padding: 15,
  backgroundColor: theme.colors.primary,
  borderRadius: 10,
  marginBottom: 20,
  alignItems: 'center',
});

const buttonTextStyle = (theme) => ({
  color: theme.colors.background,
  fontSize: 16,
});

export default AdminFeaturesScreen;
