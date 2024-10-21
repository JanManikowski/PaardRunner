// Updated SettingsScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, FlatList, TextInput } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createOrganization,
  fetchUserOrganizations,
  addCategory,
  addItem,
  exportData,
  fetchOrganizationsByCode
} from '../utils/firebaseService';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [code, setCode] = useState(''); // State to store the code input by the user

  // Check for logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);


  // Load organizations from local storage first and then fetch from database
  useEffect(() => {
    const loadOrganizationsFromLocalStorage = async () => {
      const storedOrganizations = await AsyncStorage.getItem('organizations');
      if (storedOrganizations) {
        setOrganizations(JSON.parse(storedOrganizations));
      }
      if (user) {
        await loadOrganizationsFromDatabase();
      }
    };
    loadOrganizationsFromLocalStorage();
  }, [user]);

  // Fetch organizations from the database and update local storage if needed
  const loadOrganizationsFromDatabase = async () => {
    try {
      const orgs = await fetchUserOrganizations();  // This fetches orgs based on the current user email
      const storedOrganizations = await AsyncStorage.getItem('organizations');
      const parsedStoredOrganizations = storedOrganizations ? JSON.parse(storedOrganizations) : [];
  
      if (JSON.stringify(orgs) !== JSON.stringify(parsedStoredOrganizations)) {
        setOrganizations(orgs);
        await AsyncStorage.setItem('organizations', JSON.stringify(orgs));
      }
  
      const storedActiveOrg = await AsyncStorage.getItem('activeOrgId');
      if (storedActiveOrg) {
        setActiveOrgId(storedActiveOrg);
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const handleSetActiveOrganization = async () => {
    try {
      await AsyncStorage.setItem('activeOrgId', selectedOrgId);
      console.log(`Active organization set: ${selectedOrgId}`); // Log to confirm
      setActiveOrgId(selectedOrgId);
      Alert.alert('Active organization set successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error setting active organization:', error);
      Alert.alert('Error', 'Failed to set active organization.');
    }
  };

  const handleFetchByCode = async () => {
    if (!code) {
      Alert.alert('Please enter a valid 6-digit code');
      return;
    }

    try {
      const orgs = await fetchOrganizationsByCode(code); // Fetch from Firebase
      if (orgs.length === 0) {
        Alert.alert('No organizations found for this code');
      } else {
        setOrganizations(orgs);
        await AsyncStorage.setItem('organizations', JSON.stringify(orgs)); // Save to local storage
        console.log('Fetched organizations:', orgs); // Console log the fetched data
      }
    } catch (error) {
      console.error('Error fetching organizations by code:', error);
      Alert.alert('Error', 'Failed to fetch organizations.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 }}>Settings</Text>

      {user && (
        <View style={{ marginBottom: 20 }}>
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={() => setIsModalVisible(true)}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Choose Organization</Text>
          </TouchableOpacity>

          <Modal
            animationType="slide"
            transparent={true}
            visible={isModalVisible}
            onRequestClose={() => setIsModalVisible(false)}
          >
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}>
              <View style={{ width: '80%', backgroundColor: theme.colors.card, padding: 20, borderRadius: 10 }}>
                <View style={{ backgroundColor: theme.colors.background, padding: 15, borderRadius: 10 }}>
                  <Text style={{ fontSize: 18, color: theme.colors.text, marginBottom: 20 }}>Select Active Organization:</Text>
                  <FlatList
                    data={organizations}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={{ padding: 10, backgroundColor: item.id === selectedOrgId ? theme.colors.primary : theme.colors.card, marginBottom: 10, borderRadius: 5 }}
                        onPress={() => setSelectedOrgId(item.id)}
                      >
                        <Text style={{ color: theme.colors.text }}>{item.name}</Text>
                      </TouchableOpacity>
                    )}
                  />
                  <TouchableOpacity
                    style={{
                      padding: 15,
                      backgroundColor: theme.colors.primary,
                      borderRadius: 10,
                      alignItems: 'center',
                      marginTop: 15,
                    }}
                    onPress={handleSetActiveOrganization}
                    disabled={!selectedOrgId}
                  >
                    <Text style={{ color: theme.colors.background, fontSize: 16 }}>Set Active Organization</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      padding: 10,
                      marginTop: 10,
                      alignItems: 'center',
                    }}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      )}

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 15,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('AddBar')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Add Bar</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 15,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('ManageBars')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Manage Bars</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 15,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('ItemManager')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Item Manager</Text>
      </TouchableOpacity>

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
        placeholderTextColor={theme.colors.textSecondary}
        value={code}
        onChangeText={setCode}
        keyboardType="numeric"
        maxLength={6}
      />

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 20,
        }}
        onPress={handleFetchByCode}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Fetch Organizations</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 15,
          alignItems: 'center',
        }}
        onPress={toggleTheme}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>
          Switch to {theme.dark ? 'Light Mode' : 'Dark Mode'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 15,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('AdminFeatures')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Admin</Text>
      </TouchableOpacity>

      {user && (
        <TouchableOpacity
          style={{
            padding: 15,
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={() => {
            auth.signOut().then(() => Alert.alert('Logged out')).catch((error) => Alert.alert('Error logging out', error.message));
          }}
        >
          <Text style={{ color: theme.colors.background, fontSize: 16 }}>Logout</Text>
        </TouchableOpacity>
      )}

      {!user && (
        <TouchableOpacity
          style={{
            padding: 15,
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            marginTop: 30,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={{ color: theme.colors.background, fontSize: 16 }}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SettingsScreen;