import React, { useContext, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { ThemeContext } from '../contexts/ThemeContext';
import { CategoryContext } from '../contexts/CategoryContext';  // Access CategoryContext

const BarDetailScreen = ({ route, navigation }) => {
  const { bar } = route.params;
  const { theme } = useContext(ThemeContext);
  const { categories } = useContext(CategoryContext);  // Access categories from the context
  const [missingItem, setMissingItem] = useState('');  // State to handle missing item input

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: theme.colors.background }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: theme.colors.text }}>
        {bar.name} Inventory
      </Text>

      <ScrollView>
        {/* Loop through dynamic categories */}
        {Object.keys(categories).map((categoryName) => (
          <TouchableOpacity
            key={categoryName}
            style={{
              padding: 20,
              borderRadius: 8,
              marginBottom: 10,
              backgroundColor: theme.colors.surfaceVariant,
              alignItems: 'center',
            }}
            onPress={() => navigation.navigate('CategoryList', { categoryName, bar })}  // Navigate to CategoryList
          >
            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
              View {categoryName}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Existing functionality for Strong Liquor */}
        <TouchableOpacity
          style={{
            padding: 20,
            borderRadius: 8,
            marginBottom: 10,
            backgroundColor: theme.colors.surfaceVariant,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('StrongLiquorList', { bar })}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
            View Strong Liquor
          </Text>
        </TouchableOpacity>

        {/* Missing Items Input Field */}
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10, color: theme.colors.text }}>
          Missing Items
        </Text>
        <TextInput
          style={{
            borderColor: theme.colors.border,
            borderWidth: 1,
            padding: 10,
            borderRadius: 5,
            backgroundColor: theme.colors.surfaceVariant,
            color: theme.colors.text,
            marginBottom: 20,
          }}
          placeholder="Enter custom missing item"
          value={missingItem}
          onChangeText={setMissingItem}
          onSubmitEditing={() => {
            // Handle adding the missing item
            console.log('Missing Item:', missingItem);  // You can replace this with your actual logic
            setMissingItem('');
          }}
        />

        {/* Existing functionality for Custom Items */}
        <TouchableOpacity
          style={{
            padding: 20,
            borderRadius: 8,
            marginBottom: 10,
            backgroundColor: theme.colors.surfaceVariant,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate('CustomItems', { bar })}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: theme.colors.text }}>
            View Custom Items
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default BarDetailScreen;
