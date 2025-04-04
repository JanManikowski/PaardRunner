import React, { useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { checkAndAssignUserCode } from '../utils/firebaseService';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';


const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const { theme } = useContext(ThemeContext);
  const [showPassword, setShowPassword] = useState(false);


  const auth = getAuth();

  const handleLogin = () => {
    if (email && password) {
      signInWithEmailAndPassword(auth, email, password)
        .then(async (userCredential) => {
          Alert.alert('Logged in successfully');
          await checkAndAssignUserCode(userCredential.user.uid);

          // Replace login screen with AdminFeatures
          navigation.replace('AdminDashboard');
        })
        .catch((error) => {
          Alert.alert('Login error', error.message);
        });
    } else {
      Alert.alert('Error', 'Please enter both email and password');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 40, color: theme.colors.text }}>
        Login
      </Text>

      <TextInput
        style={{
          height: 50,
          borderColor: theme.colors.text,
          borderWidth: 1,
          marginBottom: 20,
          paddingLeft: 10,
          borderRadius: 8,
          color: theme.colors.text,
        }}
        placeholder="Email"
        placeholderTextColor={theme.colors.text}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

<View style={{ position: 'relative', marginBottom: 20 }}>
  <TextInput
    style={{
      height: 50,
      borderColor: theme.colors.text,
      borderWidth: 1,
      paddingLeft: 10,
      paddingRight: 40, // space for the icon
      borderRadius: 8,
      color: theme.colors.text,
    }}
    placeholder="Password"
    placeholderTextColor={theme.colors.text}
    value={password}
    onChangeText={setPassword}
    secureTextEntry={!showPassword}
    autoCapitalize="none"
    autoCorrect={false}
  />
  <TouchableOpacity
    onPress={() => setShowPassword(!showPassword)}
    style={{
      position: 'absolute',
      right: 10,
      top: 12,
    }}
  >
    <Ionicons
      name={showPassword ? 'eye-off' : 'eye'}
      size={24}
      color={theme.colors.text}
    />
  </TouchableOpacity>
</View>


      <TouchableOpacity
        style={{
          backgroundColor: theme.colors.primary,
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
        onPress={handleLogin}
      >
        <Text style={{ color: theme.colors.background, fontSize: 16 }}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
