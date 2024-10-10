// Updated SettingsScreen.js
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createOrganization,
  fetchUserOrganizations,
  addCategory,
  addItem,
  exportData,
} from '../utils/firebaseService';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Check for logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Fetch organizations when user is logged in
  useEffect(() => {
    if (user) {
      loadOrganizations();
    }
  }, [user]);

  const loadOrganizations = async () => {
    try {
      const orgs = await fetchUserOrganizations();
      setOrganizations(orgs);
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
      setActiveOrgId(selectedOrgId);
      // Fetch the organization-specific data and store it locally
      await loadOrganizationData(selectedOrgId);
      Alert.alert('Active organization set successfully');
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error setting active organization:', error);
      Alert.alert('Error', 'Failed to set active organization.');
    }
  };

  const loadOrganizationData = async (orgId) => {
    try {
      // Fetch categories, bars, and items from Firebase
      const categories = await fetchCategories(orgId);
      const bars = await fetchBars(orgId);

      // Save data in local storage
      await AsyncStorage.setItem('categories', JSON.stringify(categories));
      await AsyncStorage.setItem('bars', JSON.stringify(bars));
    } catch (error) {
      console.error('Error loading organization data:', error);
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