import React, { useContext, useState } from 'react';
import { View, Alert } from 'react-native';
import { Text, Input, Button, Icon } from 'react-native-elements';
import { ThemeContext } from '../contexts/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddBarScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [barName, setBarName] = useState('');

  const handleAddBar = async () => {
    // Validate input
    if (!barName.trim()) {
      Alert.alert('Error', 'Please enter a bar name.');
      return;
    }

    try {
      // Retrieve the active organization ID
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        Alert.alert('Error', 'No active organization selected.');
        return;
      }

      // Fetch existing bars for this organization
      const storedBars = await AsyncStorage.getItem(`bars_${activeOrgId}`);
      const bars = storedBars ? JSON.parse(storedBars) : [];

      // Create a new bar object
      const newBar = {
        id: Date.now().toString(), // or use a UUID
        name: barName.trim(),
        orgId: activeOrgId,
      };

      // Append the new bar
      bars.push(newBar);

      // Save the updated bars array back to AsyncStorage
      await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(bars));

      Alert.alert('Success', `${barName} added successfully!`);
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add bar:', error);
      Alert.alert('Error', 'Failed to add bar');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 20,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: 30,
          color: theme.colors.text,
        }}
      >
        Add New Bar
      </Text>

      <Input
        placeholder="Enter bar name"
        placeholderTextColor={theme.colors.onSurface}
        value={barName}
        onChangeText={setBarName}
        containerStyle={{ marginBottom: 20 }}
        inputContainerStyle={{
          borderWidth: 1,
          borderColor: theme.colors.outline,
          borderRadius: 8,
          paddingHorizontal: 10,
          backgroundColor: theme.colors.surfaceVariant,
        }}
        inputStyle={{ color: theme.colors.text }}
        leftIcon={
          <Icon
            name="local-bar"
            type="material"
            size={24}
            color={theme.colors.primary}
            style={{ marginRight: 10 }}
          />
        }
      />

      <Button
        title="Add Bar"
        buttonStyle={{
          backgroundColor: theme.colors.primary,
          borderRadius: 8,
          paddingVertical: 12,
        }}
        titleStyle={{ color: theme.colors.onPrimary, fontSize: 18 }}
        onPress={handleAddBar}
      />
    </View>
  );
};

export default AddBarScreen;
