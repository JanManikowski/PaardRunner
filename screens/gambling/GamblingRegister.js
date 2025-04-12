import React, { useState, useContext } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { ThemeContext } from '../../contexts/ThemeContext';
import StyledButton from '../../components/StyledButton';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const GamblingRegisterScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const auth = getAuth();
  const db = getFirestore();

  const handleRegister = async () => {
    try {
      // Create a dummy email based on the username.
      const dummyEmail = `${username}@mygamblingapp.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, dummyEmail, password);
      const user = userCredential.user;
      
      // Initialize the user's data in Firestore with a starting coin balance.
      await setDoc(doc(db, 'users', user.uid), {
        username,
        coins: 1000  // Set an initial coin balance (adjust this value as needed)
      });
      
      Alert.alert('Success', 'Registration successful! Your coin balance has been initialized.');
      navigation.navigate('GamblingLogin');  // Or directly navigate to your main screen if desired
    } catch (error) {
      console.error('Registration Error: ', error);
      Alert.alert('Registration Failed', error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>Register</Text>
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
        title="Register"
        onPress={handleRegister}
        style={{ backgroundColor: theme.colors.primary, marginTop: 16 }}
        textStyle={{ color: theme.colors.background }}
      />
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
});

export default GamblingRegisterScreen;
