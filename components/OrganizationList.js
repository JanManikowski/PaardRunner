import React from 'react';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';

const OrganizationList = ({ organizations, onDelete }) => (
  <FlatList
    data={organizations}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => (
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          padding: 15,
          backgroundColor: '#F8F9FA',
          borderRadius: 10,
          marginBottom: 10,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: '500' }}>{item.name}</Text>
        <TouchableOpacity
          onPress={() => onDelete(item.id)}
          style={{
            backgroundColor: '#FF5C5C',
            padding: 10,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 14 }}>Delete</Text>
        </TouchableOpacity>
      </View>
    )}
  />
);

export default OrganizationList;
