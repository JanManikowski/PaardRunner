import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal, 
  TextInput 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeContext } from '../contexts/ThemeContext';

const ManageBarsScreen = ({ navigation, route }) => {
  const [bars, setBars] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editBar, setEditBar] = useState(null);
  const [editName, setEditName] = useState('');
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (route.params?.updatedBars) {
      setBars(route.params.updatedBars);
    } else {
      fetchBars();
    }
  }, [route.params?.updatedBars]);

  const fetchBars = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
      const storedBars = await AsyncStorage.getItem(`bars_${activeOrgId}`);
      if (storedBars) {
        setBars(JSON.parse(storedBars));
      }
    } catch (error) {
      console.error('Failed to load bars from storage', error);
    }
  };

  const deleteBar = async (barName) => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }

      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to delete this bar?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            onPress: async () => {
              const filteredBars = bars.filter(bar => bar.name !== barName);
              setBars(filteredBars);
              await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(filteredBars));
              navigation.navigate('ViewBars', { refresh: true });
            },
            style: 'destructive',
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Failed to delete bar', error);
    }
  };

  const editBarDetails = (bar) => {
    setEditBar(bar);
    setEditName(bar.name);
    setEditModalVisible(true);
  };

  const saveBarDetails = async () => {
    try {
      const activeOrgId = await AsyncStorage.getItem('activeOrgId');
      if (!activeOrgId) {
        console.error('No active organization selected');
        return;
      }
  
      const updatedBars = bars.map(bar => {
        if (bar.name === editBar.name) {
          return { ...bar, name: editName };
        }
        return bar;
      });
      setBars(updatedBars);
  
      await AsyncStorage.setItem(`bars_${activeOrgId}`, JSON.stringify(updatedBars));
      setEditModalVisible(false);
      navigation.navigate('ViewBars', { refresh: true });
    } catch (error) {
      console.error('Failed to save bar details', error);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{
        padding: 16,
        backgroundColor: theme.colors.background,
        flexGrow: 1,
      }}
    >
      <Text
        style={{
          fontSize: 24,
          fontWeight: 'bold',
          marginBottom: 20,
          color: theme.colors.text,
        }}
      >
        Manage Bars
      </Text>

      {bars.map((bar, index) => (
        <View
          key={index}
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.surfaceVariant,
            borderRadius: 8,
            marginBottom: 10,
            padding: 15,
            flexDirection: 'row',
          }}
        >
          <Text
            style={{
              fontSize: 18,
              color: theme.colors.text,
            }}
          >
            {bar.name}
          </Text>

          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              style={{
                backgroundColor: theme.colors.primary,
                padding: 10,
                marginRight: 10,
                borderRadius: 5,
              }}
              onPress={() => editBarDetails(bar)}
            >
              <Text style={{ color: '#fff', fontSize: 14 }}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                backgroundColor: '#F44336',
                padding: 10,
                borderRadius: 5,
              }}
              onPress={() => deleteBar(bar.name)}
            >
              <Text style={{ color: '#fff', fontSize: 14 }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {/* Edit Bar Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              margin: 20,
              backgroundColor: theme.colors.surface,
              borderRadius: 15,
              paddingVertical: 30,
              paddingHorizontal: 25,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 6,
              width: '80%',
            }}
          >
            <Text
              style={{
                fontSize: 22,
                fontWeight: 'bold',
                marginBottom: 20,
                color: theme.colors.text,
              }}
            >
              Edit Bar
            </Text>

            <TextInput
              style={{
                width: '100%',
                height: 45,
                borderColor: theme.colors.primary,
                borderWidth: 1,
                marginBottom: 25,
                paddingHorizontal: 10,
                borderRadius: 8,
                color: theme.colors.text,
                backgroundColor: theme.colors.inputBackground || '#2A2A2A',
              }}
              placeholder="Bar Name"
              placeholderTextColor={theme.colors.placeholder || '#888'}
              value={editName}
              onChangeText={setEditName}
            />

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '100%',
              }}
            >
              <TouchableOpacity
                style={{
                  backgroundColor: '#00BCD4', // bright cyan
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                  marginRight: 10,
                }}
                onPress={saveBarDetails}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FF5252', // bright red
                  padding: 12,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                }}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={{ color: '#fff', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default ManageBarsScreen;
