import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, TextInput } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  createOrganization,
  addCategory,
  addItem,
  createBarInFirebase,
  fetchUserOrganizations,
  fetchBars,
  fetchCategories,
  logLocalStorage,
} from '../utils/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminFeaturesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadOrganizations();
      }
    });
    return () => unsubscribe();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await fetchUserOrganizations();
      setOrganizations(orgs);
    } catch (error) {
      console.error('Error loading organizations:', error);
    }
  };

  const getLocalStorageData = async (key) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Error reading local storage data:', e);
      return null;
    }
  };

  const handleUploadLocalStorageToFirebase = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }
  
      const organizations = JSON.parse(await AsyncStorage.getItem('organizations')) || [];
      const org = organizations.find(org => org.id === activeOrgId);
  
      if (!org) {
        console.error('No matching organization found');
        return;
      }
  
      const orgId = await createOrUpdateOrganization(org.name, org.createdBy);
      const bars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      const barsForOrg = bars.filter(bar => bar.orgId === activeOrgId);
  
      for (let bar of barsForOrg) {
        const barId = await createBarInFirebase(orgId, bar);
  
        const categories = JSON.parse(await AsyncStorage.getItem('categories')) || [];
        const categoriesForBar = categories.filter(category => category.barId === bar.id);
  
        for (let category of categoriesForBar) {
          const categoryId = await addCategory(barId, category.name);
  
          const items = JSON.parse(await AsyncStorage.getItem('items')) || [];
          const itemsForCategory = items.filter(item => item.categoryId === category.id);
  
          for (let item of itemsForCategory) {
            await addItem(categoryId, item.name, item.maxAmount, item.picture);
          }
        }
      }
  
      Alert.alert('Upload Complete', 'Local storage data uploaded to Firebase successfully.');
    } catch (error) {
      console.error('Error uploading data to Firebase:', error);
      Alert.alert('Error', 'Failed to upload data to Firebase.');
    }
  };
  

  const handleClearLocalStorage = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Local storage has been cleared successfully.');
    } catch (error) {
      console.error('Error clearing local storage:', error);
      Alert.alert('Error', 'Failed to clear local storage.');
    }
  };

  const handleAddOrganization = async () => {
    if (newOrgName.trim() === '') {
      Alert.alert('Error', 'Organization name cannot be empty.');
      return;
    }

    try {
      await createOrganization(newOrgName, user.email);
      Alert.alert('Success', 'Organization added successfully.');
      setNewOrgName('');
      loadOrganizations();
    } catch (error) {
      console.error('Error adding organization:', error);
      Alert.alert('Error', 'Failed to add organization.');
    }
  };

  const handleLogLocalStorage = async () => {
    await logLocalStorage();
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 }}>
        Admin Features
      </Text>

      {user && (
        <>
          {/* Upload Local Storage to Firebase Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={handleUploadLocalStorageToFirebase}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Upload Local Storage to Firebase</Text>
          </TouchableOpacity>

          {/* Clear Local Storage Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.error,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={handleClearLocalStorage}
          >
            <Text style={{ color: theme.colors.onError, fontSize: 16 }}>Clear Local Storage</Text>
          </TouchableOpacity>

          {/* Add Organization Section */}
          <View style={{ marginBottom: 20 }}>
            <TextInput
              style={{
                padding: 10,
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: 5,
                marginBottom: 10,
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              placeholder="Enter organization name"
              placeholderTextColor={theme.colors.onSurface}
              value={newOrgName}
              onChangeText={setNewOrgName}
            />
            <TouchableOpacity
              style={{
                padding: 15,
                backgroundColor: theme.colors.primary,
                borderRadius: 10,
                alignItems: 'center',
              }}
              onPress={handleAddOrganization}
            >
              <Text style={{ color: theme.colors.background, fontSize: 16 }}>Add Organization</Text>
            </TouchableOpacity>
          </View>

          {/* Log Local Storage Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.secondary,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={handleLogLocalStorage}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Log Local Storage</Text>
          </TouchableOpacity>

          {/* List of Organizations */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ fontSize: 18, color: theme.colors.text, marginBottom: 10 }}>List of Organizations:</Text>
            <FlatList
              data={organizations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    padding: 15,
                    backgroundColor: theme.colors.card,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 16, color: theme.colors.text }}>{item.name}</Text>
                </View>
              )}
            />
          </View>
        </>
      )}

      {/* Back Button */}
      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          alignItems: 'center',
        }}
        onPress={() => navigation.goBack()}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AdminFeaturesScreen;