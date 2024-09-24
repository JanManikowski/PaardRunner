import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, FlatList, TextInput } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import { createOrganization, fetchUserOrganizations, addCategory, addItem, exportData } from '../utils/firebaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [orgName, setOrgName] = useState('');  // State to store the organization name
  const [categoryName, setCategoryName] = useState('');  // State to store category name
  const [itemName, setItemName] = useState('');  // State to store item name
  const [maxAmount, setMaxAmount] = useState('');

  // Check for logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const logCategoriesData = async () => {
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : {};
  
      Object.keys(categories).forEach((categoryName) => {
        console.log(`Category: ${categoryName}`);
        categories[categoryName].forEach((item) => {
          console.log(`Item Name: ${item.name}, Max Amount: ${item.maxAmount}, Image: ${item.image || 'No image'}`);
        });
      });
    } catch (error) {
      console.error('Error retrieving categories:', error);
    }
  };

  // Fetch organizations when user is logged in
  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const orgs = await fetchUserOrganizations();  // Fetch user organizations
        setOrganizations(orgs);
      } catch (error) {
        console.error('Error loading organizations:', error);
      }
    };

    if (user) {
      loadOrganizations();  // Only load organizations if the user is logged in
    }
  }, [user]);

  const handleCreateOrganization = async () => {
    if (!orgName) {
      Alert.alert('Error', 'Please provide an organization name');
      return;
    }

    try {
      const adminEmail = user.email;  // Admin is the current user
      await createOrganization(orgName, adminEmail);
      Alert.alert('Organization created successfully');
      setOrgName('');  // Clear the input field after creation
    } catch (error) {
      Alert.alert('Error creating organization', error.message);
    }
  };

  const handleAddCategory = async (orgId) => {
    if (!categoryName) {
      Alert.alert('Error', 'Please provide a category name');
      return;
    }

    try {
      const categoryId = await addCategory(orgId, categoryName);
      Alert.alert('Category added successfully');
      setCategoryName('');  // Clear input
    } catch (error) {
      Alert.alert('Error adding category', error.message);
    }
  };

  const handleAddItem = async (orgId, categoryId) => {
    if (!itemName || !maxAmount) {
      Alert.alert('Error', 'Please provide item details');
      return;
    }

    try {
      await addItem(orgId, categoryId, itemName, maxAmount, 'image_url');  // 'image_url' can be replaced with actual image data
      Alert.alert('Item added successfully');
      setItemName('');
      setMaxAmount('');
    } catch (error) {
      Alert.alert('Error adding item', error.message);
    }
  };

  const exportData = async (orgId) => {
    try {
      const storedCategories = await AsyncStorage.getItem('categories');
      const categories = storedCategories ? JSON.parse(storedCategories) : {};
  
      // Step 3: Export each category and item to Firestore
      for (const categoryName of Object.keys(categories)) {
        const categoryId = await addCategory(orgId, categoryName); // Add category to Firestore
  
        // Loop through items in the category and add them
        for (const item of categories[categoryName]) {
          await addItem(orgId, categoryId, item.name, item.maxAmount, item.image || null);
        }
      }
  
      Alert.alert('Success', 'Data has been successfully exported to Firestore.');
    } catch (error) {
      console.error('Error exporting data to Firestore:', error);
      Alert.alert('Error', 'Failed to export data to Firestore.');
    }
  };

  const handleLogin = () => {
    navigation.navigate('Login');  // Navigate to a login screen
  };

  const handleLogout = () => {
    auth.signOut()
      .then(() => Alert.alert('Logged out'))
      .catch((error) => Alert.alert('Error logging out', error.message));
  };

  const exportDataToFirestore = async () => {
    try {
      // Step 1: Fetch organizations
      const organizations = await fetchUserOrganizations();
  
      // Step 2: Handle multiple organizations
      let selectedOrgId;
      if (organizations.length > 1) {
        // If there are multiple organizations, ask the user to select one
        const orgNames = organizations.map(org => org.name);
        Alert.alert(
          'Select Organization',
          'Choose an organization to export data to:',
          orgNames.map((name, index) => ({
            text: name,
            onPress: () => {
              selectedOrgId = organizations[index].id;
              exportData(selectedOrgId); // Proceed with the export
            }
          }))
        );
      } else if (organizations.length === 1) {
        // If there's only one organization, proceed with the export
        selectedOrgId = organizations[0].id;
        await exportData(selectedOrgId);
      } else {
        Alert.alert('No Organization', 'You are not part of any organization to export data.');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      Alert.alert('Error', 'Failed to export data.');
    }
  };
  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.colors.text, marginBottom: 30 }}>
        Settings
      </Text>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 20,
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
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={exportDataToFirestore} // Export data to Firestore
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Export Data to Firestore</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{
          padding: 15,
          backgroundColor: theme.colors.primary,
          borderRadius: 10,
          marginBottom: 20,
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
          marginBottom: 20,
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
          marginBottom: 20,
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('ItemManager')}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Item Manager</Text>
      </TouchableOpacity>

      {/* Show only if the user is logged in */}
      {user ? (
        <>
          <Text style={{ color: theme.colors.text, marginBottom: 10 }}>Logged in as {user.email}</Text>

          {/* Input field to create organization */}
          <TextInput
            style={{
              borderColor: 'gray',
              borderWidth: 1,
              padding: 10,
              marginBottom: 20,
              borderRadius: 8,
              color: theme.colors.text,
            }}
            placeholder="Organization Name"
            placeholderTextColor="gray"
            value={orgName}
            onChangeText={setOrgName}
          />

          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              marginBottom: 20,
              alignItems: 'center',
            }}
            onPress={handleCreateOrganization}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Create Organization</Text>
          </TouchableOpacity>

          <FlatList
            data={organizations}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleExport(item.id)}>
                <Text style={{ color: theme.colors.text }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />  

          {/* Logout Button */}
          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
              marginBottom: 20,
              alignItems: 'center',
            }}
            onPress={handleLogout}
          >
            <Text style={{ color: theme.colors.background, fontSize: 16 }}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity
          style={{
            padding: 15,
            backgroundColor: theme.colors.primary,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={handleLogin}
        >
          <Text style={{ color: theme.colors.background, fontSize: 16 }}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default SettingsScreen;
