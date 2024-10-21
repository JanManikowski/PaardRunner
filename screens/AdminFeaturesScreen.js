import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, TextInput, Button } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { db, auth } from '../utils/firebaseConfig';
import {
  createOrUpdateOrganization,
  addCategory,
  addItem,
  createBarInFirebase,
  fetchUserOrganizations,
  fetchBars,
  fetchCategories,
  logLocalStorage,
  deleteAllOrganizations,
  deleteAllBars,
  deleteAllCategories,
  deleteAllItems,
} from '../utils/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc } from 'firebase/firestore';

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
  
      console.log('Uploading organization:', org.name);  // Add a log here
  
      const orgId = await createOrUpdateOrganization(org.name);  // Only pass organization name
      console.log('Organization created with ID:', orgId);  // Debugging log
  
      // Retrieve and filter bars for the active organization
      const bars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      const barsForOrg = bars.filter(bar => bar.orgId === activeOrgId);
  
      for (let bar of barsForOrg) {
        const barId = await createBarInFirebase(orgId, bar);
  
        // Retrieve and filter categories for the current organization (shared across bars)
        const categories = JSON.parse(await AsyncStorage.getItem('categories')) || [];
        const categoriesForOrg = categories.filter(category => category.orgId === activeOrgId);
  
        for (let category of categoriesForOrg) {
          const categoryId = await addCategory(orgId, category.name);  // Categories are now under orgId
  
          // Retrieve and filter items for the current category
          const items = JSON.parse(await AsyncStorage.getItem('items')) || [];
          const itemsForCategory = items.filter(item => item.categoryName === category.name);
  
          for (let item of itemsForCategory) {
            await addItem(orgId, category.name, item.name, item.maxAmount, item.image);  // Items linked by categoryName
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
      // Fetch the current authenticated user from Firebase Authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user.');
      }
  
      // Reference the user's document in Firestore
      const userRef = doc(db, 'users', currentUser.uid);  // Use the current user's UID
      const userDoc = await getDoc(userRef);  // Fetch the document
  
      if (!userDoc.exists()) {
        throw new Error('User document does not exist.');
      }
  
      // Log the user code from Firestore
      const userCode = userDoc.data().code;
      console.log('User Code:', userCode);  // This will log the user’s code in the console
  
      if (!userCode) {
        throw new Error('User code is missing.');
      }
  
      // Now create or update the organization with the user code
      await createOrUpdateOrganization(newOrgName, currentUser.email);
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

  const handleDeleteAllData = async () => {
    try {
      Alert.alert(
        'Warning',
        'Are you sure you want to delete all organizations, bars, categories, and items from the database? This action cannot be undone.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'OK',
            onPress: async () => {

              // Fetch all organizations, then delete related bars, categories, and items
              const organizations = await fetchUserOrganizations();
              for (let org of organizations) {
                // Delete all bars for this organization
                await deleteAllBars(org.id);

                // Fetch bars for this organization, then delete related categories
                const bars = await fetchBars(org.id);
                for (let bar of bars) {
                  await deleteAllCategories(bar.id);

                  // Fetch categories for this bar, then delete related items
                  const categories = await fetchCategories(bar.id);
                  for (let category of categories) {
                    await deleteAllItems(category.id);
                  }
                }
              }

              Alert.alert('Success', 'All data deleted successfully');
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error deleting all data:', error);
      Alert.alert('Error', 'Failed to delete data');
    }
  };

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20 }}>
        Admin Features
      </Text>

      {user && (
        <>
          {/* Upload Local Storage to Firebase Button */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
            <Button
              title="Upload Organization to Firebase"
              onPress={handleUploadLocalStorageToFirebase}
              color={theme.colors.primary}
            />
          </View>

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
      {/* Delete All Data Button */}
      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.error,
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 15,
        }}
        onPress={handleDeleteAllData}
      >
        <Text style={{ color: theme.colors.onError, fontSize: 16 }}>Delete All Data</Text>
      </TouchableOpacity>

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
