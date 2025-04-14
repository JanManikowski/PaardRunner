import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

const AdminActionButton = ({ title, onPress, style, textStyle }) => (
  <TouchableOpacity
    style={[
      {
        padding: 15,
        backgroundColor: '#007BFF',
        borderRadius: 10,
        alignItems: 'center',
        marginBottom: 15,
      },
      style,
    ]}
    onPress={onPress}
  >
    <Text style={[{ color: '#FFF', fontSize: 16 }, textStyle]}>{title}</Text>
  </TouchableOpacity>
);

export default AdminActionButton;
