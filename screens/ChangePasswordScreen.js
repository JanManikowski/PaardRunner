import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  signInWithEmailAndPassword,
  updatePassword,
} from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { ThemeContext } from '../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const ChangePasswordScreen = () => {
  const { theme } = useContext(ThemeContext);
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!email || !oldPassword || !newPassword || !confirmPassword) {
      return Alert.alert('Error', 'All fields are required');
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert('Error', 'New passwords do not match');
    }
    if (newPassword.length < 6) {
      return Alert.alert('Error', 'New password must be at least 6 characters');
    }
    try {
      // sign in with email + old password
      const { user } = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        oldPassword
      );
      // update to new password
      await updatePassword(user, newPassword);
      Alert.alert('Success', 'Password changed successfully');
      // optionally sign out so they can re-login
      navigation.replace('Login');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        padding: 16,
        backgroundColor: theme.colors.background,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          textAlign: 'center',
          color: theme.colors.text,
        }}
      >
        Change Password
      </Text>

      {/* Email */}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        placeholderTextColor={theme.colors.onSurface}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          height: 50,
          borderColor: theme.colors.text,
          borderWidth: 1,
          paddingLeft: 10,
          borderRadius: 8,
          marginBottom: 15,
          color: theme.colors.text,
        }}
      />

      {/* Old Password */}
      <View style={{ position: 'relative', marginBottom: 15 }}>
        <TextInput
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Current Password"
          placeholderTextColor={theme.colors.onSurface}
          secureTextEntry={!showOld}
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
          onPress={() => setShowOld(v => !v)}
          style={{ position: 'absolute', right: 10, top: 12 }}
        >
          <Ionicons
            name={showOld ? 'eye-off' : 'eye'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* New Password */}
      <View style={{ position: 'relative', marginBottom: 15 }}>
        <TextInput
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="New Password"
          placeholderTextColor={theme.colors.onSurface}
          secureTextEntry={!showNew}
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
          onPress={() => setShowNew(v => !v)}
          style={{ position: 'absolute', right: 10, top: 12 }}
        >
          <Ionicons
            name={showNew ? 'eye-off' : 'eye'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Confirm New Password */}
      <View style={{ position: 'relative', marginBottom: 30 }}>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm New Password"
          placeholderTextColor={theme.colors.onSurface}
          secureTextEntry={!showConfirm}
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
          onPress={() => setShowConfirm(v => !v)}
          style={{ position: 'absolute', right: 10, top: 12 }}
        >
          <Ionicons
            name={showConfirm ? 'eye-off' : 'eye'}
            size={24}
            color={theme.colors.text}
          />
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={handleChangePassword}
        style={{
          backgroundColor: theme.colors.primary,
          padding: 15,
          borderRadius: 8,
          alignItems: 'center',
        }}
      >
        <Text style={{ color: theme.colors.onPrimary, fontSize: 16 }}>
          Save Password
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChangePasswordScreen;
