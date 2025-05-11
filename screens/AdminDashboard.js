import React, {
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Alert,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemeContext } from '../contexts/ThemeContext';
import { auth } from '../utils/firebaseConfig';
import {
  fetchUserOrganizations,
  deleteOrganization,
  deleteAllDataUnderOrganization,
  createOrUpdateOrganization,
  createBarInFirebase,
  addCategory,
  addItem,
  addCrateToFirebase,
  uploadImageToFirebase,
} from '../utils/firebaseService';
import AdminActionButton from '../components/AdminActionButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signOut } from 'firebase/auth';

const AdminFeaturesScreen = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);
  const [user, setUser] = useState(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [newOrgName, setNewOrgName] = useState('');
  const [activeOrgId, setActiveOrgId] = useState(null);
  const [activeTab, setActiveTab] = useState('manageBars');
  const [orgModalVisible, setOrgModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });

  // put logout icon in header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <MaterialIcons name="logout" size={24} color={"white"} />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      if (!currentUser) {
        navigation.replace('Login');
      } else {
        setUser(currentUser);
        loadOrganizations();
        loadActiveOrgId();
      }
      setIsAuthChecked(true);
    });
    return () => unsubscribe();
  }, []);

  const loadOrganizations = async () => {
    try {
      const orgs = await fetchUserOrganizations();
      setOrganizations(orgs);
    } catch (e) {
      console.error(e);
    }
  };

  const loadActiveOrgId = async () => {
    const saved = await AsyncStorage.getItem('activeOrgId');
    setActiveOrgId(saved);
  };

  const handleSetActiveOrganization = async orgId => {
    try {
      await AsyncStorage.setItem('activeOrgId', orgId);
      setActiveOrgId(orgId);
      Alert.alert('Active Organization Selected', `You selected: ${orgId}`);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to set active organization.');
    }
  };

  const handleAddOrganization = async () => {
    if (!newOrgName.trim()) {
      return Alert.alert('Error', 'Organization name cannot be empty.');
    }
    try {
      await createOrUpdateOrganization(newOrgName);
      setNewOrgName('');
      setOrgModalVisible(false);
      loadOrganizations();
      Alert.alert('Success', 'Organization added successfully.');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to add organization.');
    }
  };

  const handleDeleteOrganization = async orgId => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this organization? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'OK',
          onPress: async () => {
            try {
              await deleteOrganization(orgId);
              Alert.alert('Success', 'Organization deleted.');
              loadOrganizations();
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete organization.');
            }
          },
        },
      ]
    );
  };

  const handleUploadLocalStorageToFirebase = async () => {
    try {
      const orgId = await AsyncStorage.getItem('activeOrgId');
      if (!orgId) {
        return Alert.alert('Error', 'No active organization selected');
      }
      setUploading(true);

      const bars = JSON.parse(await AsyncStorage.getItem(`bars_${orgId}`)) || [];
      const categories = JSON.parse(await AsyncStorage.getItem(`categories_${orgId}`)) || [];
      const crates = JSON.parse(await AsyncStorage.getItem(`customCrates_${orgId}`)) || [];

      let total =
        1 + // delete
        1 + // org
        bars.length +
        categories.length +
        categories.reduce((sum, c) => sum + (c.items?.length || 0), 0) +
        crates.length;
      let current = 0;
      setUploadProgress({ current, total });

      await deleteAllDataUnderOrganization(orgId);
      current++; setUploadProgress({ current, total });

      const allOrgs = JSON.parse(await AsyncStorage.getItem('organizations')) || [];
      const org = allOrgs.find(o => o.id === orgId);
      await createOrUpdateOrganization(org.name);
      current++; setUploadProgress({ current, total });

      for (let i = 0; i < bars.length; i++) {
        await createBarInFirebase(orgId, bars[i], i);
        current++; setUploadProgress({ current, total });
      }

      for (let i = 0; i < categories.length; i++) {
        await addCategory(orgId, categories[i].name, i);
        current++; setUploadProgress({ current, total });

        const items = categories[i].items || [];
        for (let j = 0; j < items.length; j++) {
          let url = null;
          if (items[j].image?.startsWith('file://')) {
            url = await uploadImageToFirebase(
              items[j].image,
              orgId,
              categories[i].name,
              items[j].name
            );
          } else {
            url = items[j].image;
          }
          await addItem(
            orgId,
            categories[i].name,
            items[j].name,
            items[j].maxAmount,
            url,
            j
          );
          current++; setUploadProgress({ current, total });
        }
      }

      for (let k = 0; k < crates.length; k++) {
        await addCrateToFirebase(orgId, crates[k]);
        current++; setUploadProgress({ current, total });
      }

      Alert.alert('✅ Upload Complete', 'Data uploaded successfully.');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to upload data.');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // no AsyncStorage.clear() here → your local bars/items stay intact
      navigation.replace('Login');
    } catch (error) {
      Alert.alert('Logout Error', error.message);
    }
  };

  const renderOrganizations = () => {
    return organizations.map((org) => (
      <View
        key={org.id}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingVertical: 10,
          paddingHorizontal: 10,
          marginVertical: 3,
          backgroundColor: activeOrgId === org.id 
            ? theme.colors.primary 
            : theme.colors.surfaceVariant,
          borderRadius: 5,
        }}
      >
        <AdminActionButton
          title={org.name}
          onPress={() => handleSetActiveOrganization(org.id)}
          style={{
            backgroundColor: activeOrgId === org.id 
              ? theme.colors.primary 
              : theme.colors.surfaceVariant,
            marginBottom: 0,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
          textStyle={{
            color: activeOrgId === org.id 
              ? theme.colors.background 
              : theme.colors.text,
          }}
        />
        <AdminActionButton
          title="Delete"
          onPress={() => handleDeleteOrganization(org.id)}
          style={{
            backgroundColor: theme.colors.error,
            marginBottom: 0,
            paddingVertical: 5,
            paddingHorizontal: 10,
          }}
          textStyle={{
            color: theme.colors.background,
            fontWeight: 'bold',
          }}
        />
      </View>
    ));
  };
  const renderTabContent = () => {
    if (activeTab === 'manageBars') {
      return (
        <View>
          <AdminActionButton
            title="Manage Bars"
            onPress={() => navigation.navigate('ManageBars')}
          />
          <AdminActionButton
            title="Item Manager"
            onPress={() => navigation.navigate('ManageCategories')}
          />
          <AdminActionButton
            title="Custom Crates"
            onPress={() => navigation.navigate('CustomCrates')}
          />
        </View>
      );
    }
    if (activeTab === 'organizations') {
      return (
        <View>
          <AdminActionButton
            title="Add Organization"
            onPress={() => setOrgModalVisible(true)}
          />
          <AdminActionButton
            title="Upload Data to Firebase"
            onPress={handleUploadLocalStorageToFirebase}
          />
          {renderOrganizations()}
        </View>
      );
    }
    return null;
  };

  if (!isAuthChecked || !user) {
    return null;
  }

  return (
    <>
      <ScrollView
        style={{
          flex: 1,
          padding: 16,
          backgroundColor: theme.colors.background,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: 'bold',
            marginBottom: 20,
            textAlign: 'center',
            color: 'white',
          }}
        >
          Admin Dashboard
        </Text>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-around',
            marginBottom: 20,
          }}
        >
          <AdminActionButton
            title="Manage Bars"
            onPress={() => setActiveTab('manageBars')}
            style={{
              backgroundColor:
                activeTab === 'manageBars'
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            }}
            textStyle={{
              color:
                activeTab === 'manageBars'
                  ? theme.colors.background
                  : theme.colors.text,
            }}
          />
          <AdminActionButton
            title="Organizations"
            onPress={() => setActiveTab('organizations')}
            style={{
              backgroundColor:
                activeTab === 'organizations'
                  ? theme.colors.primary
                  : theme.colors.surfaceVariant,
            }}
            textStyle={{
              color:
                activeTab === 'organizations'
                  ? theme.colors.background
                  : theme.colors.text,
            }}
          />
        </View>

        {renderTabContent()}

        <Modal
          animationType="slide"
          transparent
          visible={orgModalVisible}
          onRequestClose={() => setOrgModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: '80%',
                backgroundColor: theme.colors.surface,
                borderRadius: 10,
                padding: 20,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  marginBottom: 20,
                  color: theme.colors.text,
                }}
              >
                Add Organization
              </Text>
              <TextInput
                placeholder="Organization Name"
                placeholderTextColor={theme.colors.onSurface}
                value={newOrgName}
                onChangeText={setNewOrgName}
                style={{
                  width: '100%',
                  height: 40,
                  borderColor: theme.colors.outline,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  marginBottom: 20,
                  backgroundColor: theme.colors.surfaceVariant,
                  color: theme.colors.text,
                }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AdminActionButton
                  title="Save"
                  onPress={handleAddOrganization}
                  style={{ flex: 1, marginRight: 10 }}
                />
                <AdminActionButton
                  title="Cancel"
                  onPress={() => setOrgModalVisible(false)}
                  style={{ flex: 1, backgroundColor: theme.colors.error }}
                  textStyle={{ color: theme.colors.onError }}
                />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      {uploading && (
        <Modal transparent animationType="none">
          <View
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.7)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: '80%',
                backgroundColor: theme.colors.surface,
                borderRadius: 10,
                padding: 20,
                alignItems: 'center',
              }}
            >
              <Text
                style={{ marginBottom: 10, fontSize: 18, color: theme.colors.text }}
              >
                Uploading data...
              </Text>
              <View
                style={{
                  width: '100%',
                  height: 10,
                  backgroundColor: '#ddd',
                  borderRadius: 5,
                }}
              >
                <View
                  style={{
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`,
                    height: '100%',
                    backgroundColor: theme.colors.primary,
                    borderRadius: 5,
                  }}
                />
              </View>
              <Text
                style={{ marginTop: 10, fontSize: 16, color: theme.colors.text }}
              >
                {Math.floor((uploadProgress.current / uploadProgress.total) * 100)}%
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

export default AdminFeaturesScreen;
