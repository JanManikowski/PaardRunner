import React, { useContext } from 'react';
import { TouchableOpacity, Text } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';

const AdminActionButton = ({ title, onPress, style, textStyle }) => {
  const { theme } = useContext(ThemeContext); // Get the theme from ThemeContext

  return (
    <TouchableOpacity
      style={[
        {
          padding: 15,
          backgroundColor: theme.colors.primary, // Use theme.colors.primary
          borderRadius: 10,
          alignItems: 'center',
          marginBottom: 15,
        },
        style,
      ]}
      onPress={onPress}
    >
      <Text style={[{ color: theme.text, fontSize: 16 }, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default AdminActionButton;
