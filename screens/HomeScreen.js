import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

const HomeScreen = ({ navigation }) => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8F8F8' }}>
      <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 40 }}>
        Concert Inventory App
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          width: '80%',
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('ViewBars')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>VIEW BARS</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          marginBottom: 20,
          elevation: 2, // For Android shadow
          width: '80%',
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('AddBar')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>ADD NEW BAR</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: '#FFF',
          padding: 20,
          borderRadius: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 5,
          elevation: 2, // For Android shadow
          width: '80%',
          alignItems: 'center',
        }}
        onPress={() => navigation.navigate('Settings')}
      >
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#333' }}>SETTINGS</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
