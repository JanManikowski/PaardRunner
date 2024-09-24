// LoginScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';  // Import the correct method for Firebase v9+
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();

  const auth = getAuth();  // Initialize Firebase auth

  // Handle login with Firebase
  const handleLogin = () => {
    if (email && password) {
      signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
          Alert.alert('Logged in successfully');
          navigation.navigate('Settings');  // Navigate back to Settings screen after login
        })
        .catch((error) => {
          Alert.alert('Login error', error.message);
        });
    } else {
      Alert.alert('Error', 'Please enter both email and password');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 40 }}>
        Login
      </Text>

      <TextInput
        style={{
          height: 50,
          borderColor: 'gray',
          borderWidth: 1,
          marginBottom: 20,
          paddingLeft: 10,
          borderRadius: 8,
        }}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TextInput
        style={{
          height: 50,
          borderColor: 'gray',
          borderWidth: 1,
          marginBottom: 20,
          paddingLeft: 10,
          borderRadius: 8,
        }}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        autoCorrect={false}
      />

      <TouchableOpacity
        style={{
          backgroundColor: '#007bff',
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={handleLogin}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
