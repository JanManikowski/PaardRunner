import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import { CoinContext } from '../../contexts/CoinContext';  // Import your CoinContext
import StyledButton from '../../components/StyledButton';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const GamblingLoginScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const { loadUserBalance } = useContext(CoinContext); // << We'll call this after login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const auth = getAuth();

  const handleLogin = async () => {
    try {
      // For demonstration, we treat username as part of a dummy email domain
      const dummyEmail = `${username}@mygamblingapp.com`;
      const userCredential = await signInWithEmailAndPassword(auth, dummyEmail, password);
      const user = userCredential.user;

      // Once logged in, load coins from Firestore
      await loadUserBalance(user.uid);

      navigation.navigate('GamblingHome');
    } catch (error) {
      console.error('Login error: ', error);
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Gambling Login</Text>
      <TextInput
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
        placeholder="Username"
        placeholderTextColor={theme.colors.placeholder}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: theme.colors.text, borderColor: theme.colors.border }]}
        placeholder="Password"
        placeholderTextColor={theme.colors.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <StyledButton
        title="Login"
        onPress={handleLogin}
        style={{ backgroundColor: theme.colors.primary, marginTop: 16 }}
        textStyle={{ color: theme.colors.background }}
      />
      <TouchableOpacity onPress={() => navigation.navigate('GamblingRegister')}>
        <Text style={[styles.registerText, { color: theme.colors.text }]}>
          Don't have an account? Register here
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  registerText: {
    marginTop: 20,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});

export default GamblingLoginScreen;
