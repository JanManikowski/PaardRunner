import React, { useContext, useState, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  fetchUserOrganizations,
  fetchOrganizationsByCode,
  logLocalStorage,
} from '../utils/firebaseService';
import StyledButton from '../components/StyledButton';
import ModalSelector from '../components/ModalSelector';

const SettingsScreen = ({ navigation }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [code, setCode] = useState('');
  // State to track if the Gambling button should be displayed
  const [isGambleUnlocked, setIsGambleUnlocked] = useState(false);

  // Check for logged-in user
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Load organizations from local storage
  useEffect(() => {
    const loadOrganizations = async () => {
      const storedOrganizations = await AsyncStorage.getItem('organizations');
      const storedActiveOrg = await AsyncStorage.getItem('activeOrgId');
      if (storedOrganizations) setOrganizations(JSON.parse(storedOrganizations));
      if (storedActiveOrg) {
        setActiveOrgId(storedActiveOrg);
        setSelectedOrgId(storedActiveOrg);
      }
    };
    loadOrganizations();
  }, []);

  // Check if the special code has been stored locally and unlock gamble if so
  useEffect(() => {
    const checkSpecialCode = async () => {
      const storedCode = await AsyncStorage.getItem('specialCode');
      if (storedCode === "42069") {
        setIsGambleUnlocked(true);
      }
    };
    checkSpecialCode();
  }, []);

  const handleSetActiveOrganization = async (orgId) => {
    if (!orgId) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please select an organization.',
      });
      return;
    }
    await AsyncStorage.setItem('activeOrgId', orgId);
    setActiveOrgId(orgId);
    setIsModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: 'Active organization set successfully!',
    });
  };

  // Single handler for "Fetch Organizations" that checks for the secret code
  const handleFetchByCode = async () => {
    if (!code) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Enter a valid 6-digit code.',
      });
      return;
    }

    // If the secret code is entered, unlock the Gambling button
    if (code === "42069") {
      await AsyncStorage.setItem('specialCode', code);
      setIsGambleUnlocked(true);
      Toast.show({
        type: 'success',
        text1: 'Gamble Unlocked',
        text2: 'Gambling feature unlocked!',
      });
      return;
    }

    // Otherwise, treat the entered code as a normal code for fetching organizations
    try {
      const orgs = await fetchOrganizationsByCode(code);
      if (orgs.length === 0) {
        Toast.show({
          type: 'info',
          text1: 'No Organizations Found',
          text2: 'No organizations match the entered code.',
        });
        return;
      }
      await AsyncStorage.setItem('organizations', JSON.stringify(orgs));
      setOrganizations(orgs);
      logLocalStorage();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Organizations fetched and stored.',
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to fetch organizations.',
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, padding: 16 }}>
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: theme.colors.text,
            marginBottom: 20,
          }}
        >
          Settings
        </Text>

        {/* Choose Organization Button */}
        <StyledButton
          title="Choose Organization"
          onPress={() => setIsModalVisible(true)}
          style={{ backgroundColor: theme.colors.primary }}
          textStyle={{ color: theme.colors.background }}
        />

        {/* Modal for Selecting Organization */}
        <ModalSelector
          visible={isModalVisible}
          items={organizations}
          selectedId={selectedOrgId}
          activeId={activeOrgId}
          onSelect={setSelectedOrgId}
          onSetActive={handleSetActiveOrganization}
          onClose={() => setIsModalVisible(false)}
        />

        {/* Switch Theme Button */}
        <StyledButton
          title="Change Theme"
          onPress={toggleTheme}
          style={{ backgroundColor: theme.colors.primary }}
          textStyle={{ color: theme.colors.background }}
        />

        {/* Admin Features Button */}
        <StyledButton
          title="Admin"
          onPress={() => navigation.navigate('AdminDashboard')}
          style={{ backgroundColor: theme.colors.primary }}
          textStyle={{ color: theme.colors.background }}
        />

        <StyledButton
          title="Calendar Settings"
          onPress={() => navigation.navigate('Calendar')}
          style={{ backgroundColor: theme.colors.primary }}
          textStyle={{ color: theme.colors.background }}
        />

        {/* Conditionally render the Gambling button if unlocked */}
        {isGambleUnlocked && (
          <StyledButton
            title="Gamble"
            onPress={() => navigation.navigate('GamblingHome')}
            style={{ backgroundColor: theme.colors.primary, marginTop: 10 }}
            textStyle={{ color: theme.colors.background }}
          />
        )}
      </View>

      {/* Input and the Fetch Organizations button */}
      <View style={{ padding: 16 }}>
        <Text style={{ color: theme.colors.text, fontSize: 16 }}>
          Enter 6-digit Code:
        </Text>
        <TextInput
          style={{
            borderColor: theme.colors.text,
            borderWidth: 1,
            padding: 10,
            borderRadius: 5,
            marginBottom: 10,
            color: theme.colors.text,
          }}
          placeholder="Enter 6-digit code"
          placeholderTextColor={theme.colors.text}
          value={code}
          onChangeText={setCode}
          keyboardType="numeric"
          maxLength={6}
        />
        <StyledButton
          title="Fetch Organizations"
          onPress={handleFetchByCode}
          style={{ backgroundColor: theme.colors.primary }}
          textStyle={{ color: theme.colors.background }}
        />
      </View>
    </View>
  );
};

export default SettingsScreen;
