import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);  

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setIsAdmin(true);  
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsubscribe();
  }, []);


  const handleLogin = () => {
    navigation.navigate('Login');  // Navigate to a login screen
  };

  const handleLogout = () => {
    auth.signOut()
      .then(() => Alert.alert('Logged out'))
      .catch((error) => Alert.alert('Error logging out', error.message));
  };

  const handleExport = () => {
    // Logic for exporting data
    Alert.alert('Exporting data...');
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
        onPress={() => navigation.navigate('ItemManager')}  // New button for Item Manager
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Item Manager</Text>
      </TouchableOpacity>

      {user ? (
        <>
          <Text style={{ color: theme.colors.text, marginBottom: 10 }}>Logged in as {user.email}</Text>

          {isAdmin && (
            <TouchableOpacity
              style={{
                padding: 15,
                backgroundColor: theme.colors.primary,
                borderRadius: 10,
                marginBottom: 20,
                alignItems: 'center',
              }}
              onPress={handleExport}
            >
              <Text style={{ color: theme.colors.background, fontSize: 16 }}>Export to Database</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              padding: 15,
              backgroundColor: theme.colors.primary,
              borderRadius: 10,
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
