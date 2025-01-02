import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  fetchUserOrganizations,
  fetchOrganizationsByCode,
  logLocalStorage,
} from '../utils/firebaseService';
import StyledButton from '../components/StyledButton';
import ModalSelector from '../components/ModalSelector';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [code, setCode] = useState('');

  // Check for logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load organizations from local storage
  useEffect(() => {
    const loadOrganizations = async () => {
      const storedOrganizations = await AsyncStorage.getItem('organizations');
      const storedActiveOrg = await AsyncStorage.getItem('activeOrgId');
      if (storedOrganizations) setOrganizations(JSON.parse(storedOrganizations));
      if (storedActiveOrg) {
        setActiveOrgId(storedActiveOrg);
        setSelectedOrgId(storedActiveOrg);
      }
    };
    loadOrganizations();
  }, []);

  const handleSetActiveOrganization = async (orgId) => {
    if (!orgId) return Alert.alert('Error', 'Please select an organization.');
    await AsyncStorage.setItem('activeOrgId', orgId);
    setActiveOrgId(orgId);
    setIsModalVisible(false);
    Alert.alert('Success', 'Active organization set successfully!');
  };

  const handleFetchByCode = async () => {
    if (!code) return Alert.alert('Error', 'Enter a valid 6-digit code.');
    try {
      const orgs = await fetchOrganizationsByCode(code);
      if (orgs.length === 0) return Alert.alert('No organizations found.');
      await AsyncStorage.setItem('organizations', JSON.stringify(orgs));
      setOrganizations(orgs);
      logLocalStorage();
      Alert.alert('Success', 'Organizations fetched and stored.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to fetch organizations.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 }}>
        Settings
      </Text>

      {/* Choose Organization Button */}
      <StyledButton
        title="Choose Organization"
        onPress={() => setIsModalVisible(true)}
        style={{ backgroundColor: theme.colors.primary }}
        textStyle={{ color: theme.colors.background }}
      />

      {/* Modal for Selecting Organization */}
      <ModalSelector
        visible={isModalVisible}
        items={organizations}
        selectedId={selectedOrgId}
        activeId={activeOrgId}
        onSelect={setSelectedOrgId}
        onSetActive={handleSetActiveOrganization}
        onClose={() => setIsModalVisible(false)}
      />

      {/* Input for 6-digit Code */}
      <Text style={{ color: theme.colors.text, fontSize: 16 }}>Enter 6-digit Code:</Text>
      <TextInput
        style={{
          borderColor: theme.colors.text,
          borderWidth: 1,
          padding: 10,
          borderRadius: 5,
          marginBottom: 20,
          color: theme.colors.text,
        }}
        placeholder="Enter 6-digit code"
        placeholderTextColor={theme.colors.text}
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        maxLength={6}
      />

      {/* Fetch Organizations Button */}
      <StyledButton
        title="Fetch Organizations"
        onPress={handleFetchByCode}
        style={{ backgroundColor: theme.colors.primary }}
        textStyle={{ color: theme.colors.background }}
      />

      {/* Switch Theme Button */}
      <StyledButton
        title={`Switch to ${theme.dark ? 'Light Mode' : 'Dark Mode'}`}
        onPress={toggleTheme}
        style={{ backgroundColor: theme.colors.primary }}
        textStyle={{ color: theme.colors.background }}
      />

      {/* Admin Features Button */}
      <StyledButton
        title="Admin"
        onPress={() => navigation.navigate('AdminFeatures')}
        style={{ backgroundColor: theme.colors.primary }}
        textStyle={{ color: theme.colors.background }}
      />
    </View>
  );
};

export default SettingsScreen;
