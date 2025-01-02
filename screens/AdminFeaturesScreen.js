import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  fetchUserOrganizations,
  deleteOrganization,
  logLocalStorage,
  deleteAllBars,
  createOrUpdateOrganization,
  createBarInFirebase,
  addItem,
  addCategory,
} from '../utils/firebaseService';
import AdminActionButton from '../components/AdminActionButton';
import OrganizationList from '../components/OrganizationList';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminFeaturesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [activeTab, setActiveTab] = useState('manageBars'); // Default tab: Manage Bars

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigation.navigate('Login'); // Redirect to Login if not logged in
      } else {
        setUser(currentUser);
        loadOrganizations();
        loadActiveOrgId();
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

  const loadActiveOrgId = async () => {
    const savedOrgId = await AsyncStorage.getItem('activeOrgId');
    setActiveOrgId(savedOrgId || null);
    console.log('Loaded active organization ID:', savedOrgId);
  };

  const handleSetActiveOrganization = async (orgId) => {
    try {
      await AsyncStorage.setItem('activeOrgId', orgId);
      setActiveOrgId(orgId);
      console.log('Active organization ID set to:', orgId);
      Alert.alert('Active Organization Selected', `You selected: ${orgId}`);
    } catch (error) {
      console.error('Error setting active organization:', error);
      Alert.alert('Error', 'Failed to set active organization.');
    }
  };

  const handleAddOrganization = async () => {
    if (newOrgName.trim() === '') {
      Alert.alert('Error', 'Organization name cannot be empty.');
      return;
    }
    try {
      await createOrUpdateOrganization(newOrgName);
      setNewOrgName('');
      loadOrganizations();
      Alert.alert('Success', 'Organization added successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to add organization.');
    }
  };

  const handleDeleteOrganization = async (orgId) => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this organization? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await deleteOrganization(orgId);
              Alert.alert('Success', 'Organization deleted successfully.');
              loadOrganizations(); // Refresh organization list
            } catch (error) {
              console.error('Error deleting organization:', error);
              Alert.alert('Error', 'Failed to delete organization.');
            }
          },
        },
      ]
    );
  };

  const handleUploadLocalStorageToFirebase = async () => {
    console.log("CURRENT ORG NAME", activeOrgId);
    try {
      console.log("Starting upload of local storage data to Firebase...");

      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error("No active organization selected");
        Alert.alert('Error', 'No active organization selected');
        return;
      }

      const organizations = JSON.parse(await AsyncStorage.getItem('organizations')) || [];
      console.log("Organizations in local storage:", organizations);

      const org = organizations.find(org => org.id === activeOrgId);
      if (!org) {
        console.error("No matching organization found in local storage for activeOrgId", activeOrgId);
        return;
      }

      console.log("Uploading organization:", org);

      const orgId = await createOrUpdateOrganization(org.name);
      console.log("Organization created/updated in Firebase with ID:", orgId);

      const bars = JSON.parse(await AsyncStorage.getItem('bars')) || [];
      console.log("Bars in local storage:", bars);

      const barsForOrg = bars.filter(bar => bar.orgId === activeOrgId);
      console.log(`Bars matching active organization (ID: ${activeOrgId}):`, barsForOrg);

      for (let bar of barsForOrg) {
        const barId = await createBarInFirebase(orgId, bar);
        console.log(`Bar created/updated in Firebase: ${bar.name}, ID: ${barId}`);

        const categories = JSON.parse(await AsyncStorage.getItem('categories')) || [];
        console.log("Categories in local storage:", categories);

        const categoriesForOrg = categories.filter(category => category.orgId === activeOrgId);
        console.log(`Categories matching active organization (ID: ${activeOrgId}):`, categoriesForOrg);

        for (let category of categoriesForOrg) {
          const categoryId = await addCategory(orgId, category.name);
          console.log(`Category created/updated in Firebase: ${category.name}, ID: ${categoryId}`);

          const items = JSON.parse(await AsyncStorage.getItem('items')) || [];
          console.log("Items in local storage:", items);

          const itemsForCategory = items.filter(item => item.categoryName === category.name);
          console.log(`Items matching category ${category.name}:`, itemsForCategory);

          for (let item of itemsForCategory) {
            await addItem(orgId, category.name, item.name, item.maxAmount, item.image);
            console.log(`Item created/updated in Firebase: ${item.name}`);
          }
        }
      }

      Alert.alert('Upload Complete', 'Local storage data uploaded to Firebase successfully.');
      console.log("Upload process completed successfully.");
    } catch (error) {
      console.error('Error uploading data to Firebase:', error);
      Alert.alert('Error', 'Failed to upload data to Firebase.');
    }
  };

  const renderOrganizations = () => {
    return organizations.map((org) => (
      <TouchableOpacity
        key={org.id}
        style={{
          padding: 10,
          marginVertical: 5,
          backgroundColor: activeOrgId === org.id ? theme.colors.primary : theme.colors.surfaceVariant,
          borderRadius: 5,
        }}
        onPress={() => handleSetActiveOrganization(org.id)}
      >
        <Text
          style={{
            color: activeOrgId === org.id ? theme.colors.background : theme.colors.text,
          }}
        >
          {org.name}
        </Text>
      </TouchableOpacity>
    ));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'manageBars':
        return (
          <View>
            <AdminActionButton
              title="Add Bar"
              onPress={() => navigation.navigate('AddBar')}
            />
            <AdminActionButton
              title="Manage Bars"
              onPress={() => navigation.navigate('ManageBars')}
            />
            <AdminActionButton
              title="Item Manager"
              onPress={() => navigation.navigate('ItemManager')}
            />
          </View>
        );
      case 'debugging':
        return (
          <View>
            <AdminActionButton
              title="Log Local Storage"
              onPress={logLocalStorage}
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <AdminActionButton
              title="Delete All Data"
              onPress={() => {
                Alert.alert(
                  'Confirm Delete',
                  'Are you sure you want to delete all data? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'OK',
                      onPress: async () => {
                        try {
                          await deleteAllBars(); // Adjust this to handle all deletions
                          Alert.alert('Success', 'All data deleted.');
                        } catch (error) {
                          console.error(error);
                          Alert.alert('Error', 'Failed to delete data.');
                        }
                      },
                    },
                  ]
                );
              }}
              style={{ backgroundColor: theme.colors.error }}
            />
          </View>
        );
      case 'organizations':
        return (
          <View>
            <TextInput
              style={{
                padding: 10,
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: 5,
                marginBottom: 15,
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              placeholder="Organization Name"
              placeholderTextColor={theme.colors.onSurface}
              value={newOrgName}
              onChangeText={setNewOrgName}
            />
            <AdminActionButton title="Add Organization" onPress={handleAddOrganization} />
            <AdminActionButton
              title="Upload Data to Firebase"
              onPress={handleUploadLocalStorageToFirebase}
            />
            {renderOrganizations()}
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <ScrollView style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Admin Dashboard
      </Text>

      {/* Tab Navigation */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('manageBars')}
          style={{
            padding: 10,
            backgroundColor: activeTab === 'manageBars' ? theme.colors.primary : theme.colors.surfaceVariant,
            borderRadius: 5,
          }}
        >
          <Text
            style={{
              color: activeTab === 'manageBars' ? theme.colors.background : theme.colors.text,
              fontSize: 16,
            }}
          >
            Manage Bars
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('debugging')}
          style={{
            padding: 10,
            backgroundColor: activeTab === 'debugging' ? theme.colors.primary : theme.colors.surfaceVariant,
            borderRadius: 5,
          }}
        >
          <Text
            style={{
              color: activeTab === 'debugging' ? theme.colors.background : theme.colors.text,
              fontSize: 16,
            }}
          >
            Debugging
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('organizations')}
          style={{
            padding: 10,
            backgroundColor: activeTab === 'organizations' ? theme.colors.primary : theme.colors.surfaceVariant,
            borderRadius: 5,
          }}
        >
          <Text
            style={{
              color: activeTab === 'organizations' ? theme.colors.background : theme.colors.text,
              fontSize: 16,
            }}
          >
            Organizations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </ScrollView>
  );
};

export default AdminFeaturesScreen;
