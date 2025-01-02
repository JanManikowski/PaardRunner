import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

const StyledButton = ({ title, onPress, disabled, style, textStyle }) => (
  <TouchableOpacity
    style={[
      {
        padding: 15,
        backgroundColor: disabled ? '#d3d3d3' : '#007BFF',
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
      },
      style,
    ]}
    onPress={onPress}
    disabled={disabled}
  >
    <Text style={[{ color: '#FFF', fontSize: 16 }, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

export default StyledButton;
