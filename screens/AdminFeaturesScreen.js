import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Alert, Modal } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  fetchUserOrganizations,
  deleteOrganization,
  deleteAllBars,
  createOrUpdateOrganization,
  createBarInFirebase,
  addItem,
  addCategory,
  addCrateToFirebase,
  deleteAllDataUnderOrganization
} from '../utils/firebaseService';
import AdminActionButton from '../components/AdminActionButton';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminFeaturesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [activeTab, setActiveTab] = useState('manageBars'); // Default tab: Manage Bars
  const [orgModalVisible, setOrgModalVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigation.replace('Login'); // Replace screen so the user cannot go back without logging in
      } else {
        setUser(currentUser);
        loadOrganizations();
        loadActiveOrgId();
      }
      setIsAuthChecked(true);
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
      setOrgModalVisible(false);
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
    try {
      console.log("Starting upload of local storage data to Firebase...");
  
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected');
        return;
      }
  
      await deleteAllDataUnderOrganization(activeOrgId);
      console.log(`All data under organization ${activeOrgId} deleted.`);
  
      const organizations = JSON.parse(await AsyncStorage.getItem('organizations')) || [];
      const org = organizations.find(o => o.id === activeOrgId);
      if (!org) {
        Alert.alert('Error', 'Organization not found in local storage.');
        return;
      }
  
      await createOrUpdateOrganization(org.name);
      const orgId = activeOrgId;
      console.log("Organization uploaded:", org.name);
  
      // Upload Bars with order:
      const barsForOrg = JSON.parse(await AsyncStorage.getItem(`bars_${activeOrgId}`)) || [];
      for (let i = 0; i < barsForOrg.length; i++) {
        let bar = barsForOrg[i];
        await createBarInFirebase(orgId, bar, i); // pass i as the order
        console.log(`Uploaded bar: ${bar.name} with order ${i}`);
      }
  
      // Upload Categories and Items with order:
      const categories = JSON.parse(await AsyncStorage.getItem(`categories_${activeOrgId}`)) || [];
      for (let i = 0; i < categories.length; i++) {
        let category = categories[i];
        await addCategory(orgId, category.name, i); // include order
        console.log(`Uploaded category: ${category.name} with order ${i}`);
  
        const itemsForCategory = category.items || [];
        for (let j = 0; j < itemsForCategory.length; j++) {
          let item = itemsForCategory[j];
          await addItem(orgId, category.name, item.name, item.maxAmount, item.image, j); // include order
          console.log(`Uploaded item: ${item.name} with order ${j}`);
        }
      }
  
      // Upload custom crates (if order is relevant, adjust similarly)
      const customCrates = JSON.parse(await AsyncStorage.getItem(`customCrates_${activeOrgId}`)) || [];
      for (const crate of customCrates) {
        await addCrateToFirebase(orgId, crate);
        console.log(`Uploaded crate: ${crate.name}`);
      }
  
      Alert.alert('Upload Complete', 'Local storage data uploaded successfully.');
    } catch (error) {
      console.error('Error uploading data:', error);
      Alert.alert('Error', 'Failed to upload data.');
    }
  };
  
  
  

  const clearLocalStorage = async () => {
    try {
      await AsyncStorage.clear();
      Alert.alert('Success', 'Local storage has been cleared.');
    } catch (error) {
      console.error('Error clearing local storage:', error);
      Alert.alert('Error', 'Failed to clear local storage.');
    }
  };

  const renderOrganizations = () => {
    return organizations.map((org) => (
      <View
        key={org.id}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          // Reduced overall padding to shrink row height
          paddingVertical: 10,
          paddingHorizontal: 10,
          marginVertical: 3,
          backgroundColor: activeOrgId === org.id 
            ? theme.colors.primary 
            : theme.colors.surfaceVariant,
          borderRadius: 5,
        }}
      >
        <AdminActionButton
          title={org.name}
          onPress={() => handleSetActiveOrganization(org.id)}
          // Override default AdminActionButton padding to make button smaller
          style={{
            backgroundColor: activeOrgId === org.id 
              ? theme.colors.primary 
              : theme.colors.surfaceVariant,
            marginBottom: 0,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
          textStyle={{
            color: activeOrgId === org.id 
              ? theme.colors.background 
              : theme.colors.text,
          }}
        />
        <AdminActionButton
          title="Delete"
          onPress={() => handleDeleteOrganization(org.id)}
          // Same override here to keep both buttons the same size
          style={{
            backgroundColor: theme.colors.error,
            marginBottom: 0,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
          textStyle={{
            color: theme.colors.background,
            fontWeight: 'bold',
          }}
        />
      </View>
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
            <AdminActionButton
              title="Custom Crates"
              onPress={() => navigation.navigate('CustomCrates')}
            />
          </View>
        );
      case 'debugging':
        return (
          <View>
            <AdminActionButton
              title="Log All Bars in Local Storage"
              onPress={async () => {
                try {
                  const organizations = JSON.parse(await AsyncStorage.getItem('organizations')) || [];
                  console.log("Organizations in Local Storage:", organizations);
                  let allBars = [];
                  for (let org of organizations) {
                    const orgBars = JSON.parse(await AsyncStorage.getItem(`bars_${org.id}`)) || [];
                    console.log(`Bars for Organization (${org.id}):`, orgBars);
                    allBars = [...allBars, ...orgBars];
                  }
                  console.log("All Bars in Local Storage Across All Organizations:", allBars);
                } catch (error) {
                  console.error("Error logging all bars:", error);
                }
              }}
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <AdminActionButton
              title="Log Bars from Active Org"
              onPress={async () => {
                try {
                  const activeOrgId = await AsyncStorage.getItem('activeOrgId');
                  if (!activeOrgId) {
                    console.log("No active organization selected.");
                    return;
                  }
                  const barsForActiveOrg = JSON.parse(await AsyncStorage.getItem(`bars_${activeOrgId}`)) || [];
                  console.log(`Bars for Active Organization (${activeOrgId}):`, barsForActiveOrg);
                } catch (error) {
                  console.error("Error logging bars for active organization:", error);
                }
              }}
              style={{ backgroundColor: theme.colors.secondary }}
            />
            <AdminActionButton
              title="Delete All Bars"
              onPress={() => {
                Alert.alert(
                  'Confirm Delete',
                  'Are you sure you want to delete all bars? This action cannot be undone.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'OK',
                      onPress: async () => {
                        try {
                          const organizations = JSON.parse(await AsyncStorage.getItem('organizations')) || [];
                          for (let org of organizations) {
                            await AsyncStorage.removeItem(`bars_${org.id}`);
                          }
                          Alert.alert('Success', 'All bars deleted.');
                        } catch (error) {
                          console.error("Error deleting bars:", error);
                          Alert.alert('Error', 'Failed to delete bars.');
                        }
                      },
                    },
                  ]
                );
              }}
              style={{ backgroundColor: theme.colors.error }}
            />
            <AdminActionButton
              title="Clear Local Storage"
              onPress={clearLocalStorage}
              style={{ backgroundColor: theme.colors.error }}
            />
          </View>
        );
      case 'organizations':
        return (
          <View>
            {/* Both buttons below now use AdminActionButton to ensure they have the same size */}
            <AdminActionButton
              title="Add Organization"
              onPress={() => setOrgModalVisible(true)}
            />
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

  if (!isAuthChecked || !user) {
    return null;
  }

  return (
    <ScrollView
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 28,
          fontWeight: 'bold',
          marginBottom: 20,
          textAlign: 'center',
          color: 'white',
        }}
      >
        Admin Dashboard
      </Text>

      {/* Tab Navigation */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-around',
          marginBottom: 20,
        }}
      >
        <AdminActionButton
          title="Manage Bars"
          onPress={() => setActiveTab('manageBars')}
          style={{
            backgroundColor: activeTab === 'manageBars' ? theme.colors.primary : theme.colors.surfaceVariant,
          }}
          textStyle={{
            color: activeTab === 'manageBars' ? theme.colors.background : theme.colors.text,
          }}
        />
        <AdminActionButton
          title="Debugging"
          onPress={() => setActiveTab('debugging')}
          style={{
            backgroundColor: activeTab === 'debugging' ? theme.colors.primary : theme.colors.surfaceVariant,
          }}
          textStyle={{
            color: activeTab === 'debugging' ? theme.colors.background : theme.colors.text,
          }}
        />
        <AdminActionButton
          title="Organizations"
          onPress={() => setActiveTab('organizations')}
          style={{
            backgroundColor: activeTab === 'organizations' ? theme.colors.primary : theme.colors.surfaceVariant,
          }}
          textStyle={{
            color: activeTab === 'organizations' ? theme.colors.background : theme.colors.text,
          }}
        />
      </View>

      {/* Render Tab Content */}
      {renderTabContent()}

      {/* Organization Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={orgModalVisible}
        onRequestClose={() => setOrgModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
          }}
        >
          <View
            style={{
              width: '80%',
              backgroundColor: theme.colors.surface,
              borderRadius: 10,
              padding: 20,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.3,
              shadowRadius: 4,
              elevation: 5,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: 'bold',
                marginBottom: 20,
                color: theme.colors.text,
              }}
            >
              Add Organization
            </Text>
            <TextInput
              style={{
                width: '100%',
                height: 40,
                borderColor: theme.colors.outline,
                borderWidth: 1,
                borderRadius: 8,
                paddingHorizontal: 10,
                marginBottom: 20,
                color: theme.colors.text,
                backgroundColor: theme.colors.surfaceVariant,
              }}
              placeholder="Organization Name"
              placeholderTextColor={theme.colors.onSurface}
              value={newOrgName}
              onChangeText={setNewOrgName}
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <AdminActionButton
                title="Save"
                onPress={handleAddOrganization}
                style={{ flex: 1, marginRight: 10 }}
              />
              <AdminActionButton
                title="Cancel"
                onPress={() => setOrgModalVisible(false)}
                style={{ flex: 1, backgroundColor: '#F44336' }}
                textStyle={{ color: '#fff' }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default AdminFeaturesScreen;
