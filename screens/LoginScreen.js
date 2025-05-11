import React, { useContext, useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import { auth } from '../utils/firebaseConfig';
import { checkAndAssignUserCode } from '../utils/firebaseService';
import { ThemeContext } from '../contexts/ThemeContext';

const LoginScreen = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);

  // If already signed in, go straight to admin (and replace so back goes to Settings)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      if (user) {
        navigation.replace('AdminDashboard');
      }
    });
    return unsubscribe;
  }, [navigation]);

  const handleLogin = async () => {
    if (!email || !password) {
      return Alert.alert('Error', 'Please enter both email and password');
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem(
        'stayLoggedIn',
        stayLoggedIn ? 'true' : 'false'
      );
      await checkAndAssignUserCode(cred.user.uid);
      Alert.alert('Logged in successfully');
      // replace login with admin so back goes to Settings, not Login
      navigation.replace('AdminFeatures');
    } catch (error) {
      Alert.alert('Login error', error.message);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        padding: 16,
        backgroundColor: theme.colors.background,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 40,
          color: theme.colors.text,
        }}
      >
        Login
      </Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.colors.text}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          height: 50,
          borderColor: theme.colors.text,
          borderWidth: 1,
          marginBottom: 20,
          paddingLeft: 10,
          borderRadius: 8,
          color: theme.colors.text,
        }}
      />

      <View style={{ position: 'relative', marginBottom: 20 }}>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={theme.colors.text}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          style={{
            height: 50,
            borderColor: theme.colors.text,
            borderWidth: 1,
            paddingLeft: 10,
            paddingRight: 40,
            borderRadius: 8,
            color: theme.colors.text,
          }}
        />
        <TouchableOpacity
          onPress={() => setShowPassword(v => !v)}
          style={{ position: 'absolute', right: 10, top: 12 }}
        >
          <Ionicons
            name={showPassword ? 'eye-off' : 'eye'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => setStayLoggedIn(v => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}
      >
        <Ionicons
          name={stayLoggedIn ? 'checkbox-outline' : 'square-outline'}
          size={24}
          color={theme.colors.text}
          style={{ marginRight: 8 }}
        />
        <Text style={{ color: theme.colors.text }}>Stay logged in</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleLogin}
        style={{
          backgroundColor: theme.colors.primary,
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>
          Login
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
