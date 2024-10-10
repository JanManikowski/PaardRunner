// Updated AdminFeaturesScreen.js with buttons for exporting data and uploading from local storage.
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  exportAllOrganizations,
  fetchUserOrganizations,
  createOrganization,
  createBarInFirebase,
  fetchBar,
  fetchCategory,
  createCategoryInFirebase,
  fetchItem,
  createItemInFirebase,
  logLocalStorageData
} from '../utils/firebaseService';

// Assume AsyncStorage is used for local storage
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminFeaturesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);

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

  const handleCreateOrganization = async () => {
    try {
      const orgName = 'New Organization'; // You can replace this with user input in the future
      await createOrganization(orgName, user.email);
      Alert.alert('Success', 'Organization created successfully.');
      loadOrganizations();
    } catch (error) {
      console.error('Error creating organization:', error);
      Alert.alert('Error', 'Failed to create organization.');
    }
  };

  const handleUploadLocalStorageToFirebase = async () => {
    try {
      const bars = await getLocalStorageData('bars');
      const categories = await getLocalStorageData('categories');
      const items = await getLocalStorageData('items');
  
      if (bars) {
        for (let bar of bars) {
          // Create a new bar in Firebase without managing an ID manually
          await createBarInFirebase(bar);
          console.log('Bar uploaded:', bar);
        }
      }
  
      if (categories) {
        for (let category of categories) {
          // Assume barId is obtained dynamically, you may need additional logic here
          await createCategoryInFirebase(category);
          console.log('Category uploaded:', category);
        }
      }
  
      if (items) {
        for (let item of items) {
          // Assume barId and categoryId are obtained dynamically
          await createItemInFirebase(item);
          console.log('Item uploaded:', item);
        }
      }
  
      Alert.alert('Upload Complete', 'Local storage data uploaded to Firebase successfully.');
    } catch (error) {
      console.error('Error uploading data to Firebase:', error);
      Alert.alert('Error', 'Failed to upload data to Firebase.');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 }}>
        Admin Features
      </Text>

      {user && (
        <>
          {/* Export Data Button */}
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

          {/* Add Organization Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={handleCreateOrganization}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Add Organization</Text>
          </TouchableOpacity>

          {/* Add Organization Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={logLocalStorageData}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Log</Text>
          </TouchableOpacity>
        </>
      )}

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

