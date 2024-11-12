import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, TextInput, ScrollView } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  createOrUpdateOrganization,
  fetchUserOrganizations,
  logLocalStorage,
  deleteAllBars,
  deleteAllCategories,
  deleteAllItems,
  createBarInFirebase,
  addCategory,
  addItem,
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

  const handleAddOrganization = async () => {
    if (newOrgName.trim() === '') {
      Alert.alert('Error', 'Organization name cannot be empty.');
      return;
    }

    try {
      await createOrUpdateOrganization(newOrgName, user.email);
      Alert.alert('Success', 'Organization added successfully.');
      setNewOrgName('');
      loadOrganizations();
    } catch (error) {
      console.error('Error adding organization:', error);
      Alert.alert('Error', 'Failed to add organization.');
    }
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
              const organizations = await fetchUserOrganizations();
              for (let org of organizations) {
                await deleteAllBars(org.id);
                const bars = await fetchBars(org.id);
                for (let bar of bars) {
                  await deleteAllCategories(bar.id);
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
  
      console.log('Uploading organization:', org.name);
  
      const orgId = await createOrUpdateOrganization(org.name);
      console.log('Organization created with ID:', orgId);
  
      // Retrieve and filter bars for the active organization
      const bars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      const barsForOrg = bars.filter(bar => bar.orgId === activeOrgId);
  
      for (let bar of barsForOrg) {
        const barId = await createBarInFirebase(orgId, bar);
  
        // Retrieve and filter categories for the current organization
        const categories = JSON.parse(await AsyncStorage.getItem('categories')) || [];
        const categoriesForOrg = categories.filter(category => category.orgId === activeOrgId);
  
        for (let category of categoriesForOrg) {
          const categoryId = await addCategory(orgId, category.name);
  
          // Retrieve and filter items for the current category
          const items = JSON.parse(await AsyncStorage.getItem('items')) || [];
          const itemsForCategory = items.filter(item => item.categoryName === category.name);
  
          for (let item of itemsForCategory) {
            await addItem(orgId, category.name, item.name, item.maxAmount, item.image);
          }
        }
      }
  
      Alert.alert('Upload Complete', 'Local storage data uploaded to Firebase successfully.');
    } catch (error) {
      console.error('Error uploading data to Firebase:', error);
      Alert.alert('Error', 'Failed to upload data to Firebase.');
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: theme.colors.text, marginBottom: 20, alignSelf: 'center' }}>
        Admin Dashboard
      </Text>

      {!user && (
        <TouchableOpacity
          style={{
            padding: 15,
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            marginVertical: 30,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={{ color: theme.colors.background, fontSize: 18, fontWeight: 'bold' }}>Login</Text>
        </TouchableOpacity>
      )}

      {user && (
        <>
          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 22, color: theme.colors.text, marginBottom: 15, fontWeight: '600' }}>
              Add New Organization
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                style={{
                  flex: 1,
                  padding: 10,
                  borderColor: theme.colors.outline,
                  borderWidth: 1,
                  borderRadius: 5,
                  marginRight: 10,
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
                <Text style={{ color: theme.colors.background, fontSize: 16 }}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ marginBottom: 30 }}>
            <Text style={{ fontSize: 22, color: theme.colors.text, marginBottom: 10, fontWeight: '600' }}>
              Organizations
            </Text>
            <FlatList
              data={organizations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View
                  style={{
                    padding: 20,
                    backgroundColor: theme.colors.card,
                    borderRadius: 10,
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ fontSize: 18, color: theme.colors.text, fontWeight: '500' }}>{item.name}</Text>
                </View>
              )}
            />
          </View>

          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.secondary,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={logLocalStorage}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Log Local Storage</Text>
          </TouchableOpacity>

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
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Upload Organization to Firebase</Text>
          </TouchableOpacity>

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

          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              alignItems: 'center',
              marginBottom: 15,
            }}
            onPress={() => {
              auth
                .signOut()
                .then(() => Alert.alert('Logged out'))
                .catch((error) => Alert.alert('Error logging out', error.message));
            }}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Logout</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
};

export default AdminFeaturesScreen;
