import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where, setDoc, doc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Function to create or update an organization in Firebase
export const createOrUpdateOrganization = async (name, email) => {
  try {
    const q = query(collection(db, 'organizations'), where('name', '==', name));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      // Update existing organization
      const orgDoc = querySnapshot.docs[0];
      await setDoc(doc(db, 'organizations', orgDoc.id), {
        name: name,
        createdBy: email,
      }, { merge: true });
      console.log('Organization updated:', orgDoc.id);
      return orgDoc.id;
    } else {
      // Create new organization
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name: name,
        createdBy: email,
      });
      console.log('Organization added:', orgRef.id);
      return orgRef.id;
    }
  } catch (error) {
    console.error('Error creating or updating organization:', error);
    throw error;
  }
};

// Function to create a bar in Firebase
export const createBarInFirebase = async (orgId, bar) => {
  try {
    const barRef = await addDoc(collection(db, 'bars'), {
      name: bar.name,
      numShelves: bar.numShelves,
      numFridges: bar.numFridges,
      orgId: orgId,  // Storing orgId separately
    });
    console.log('Bar added:', barRef.id);
    return barRef.id;
  } catch (error) {
    console.error('Error adding bar:', error);
    throw error;
  }
};


// Function to add a category in Firebase
export const addCategory = async (barId, categoryName) => {
  try {
    const categoryRef = await addDoc(collection(db, 'categories'), {
      name: categoryName,
      barId: barId,
    });
    console.log('Category added:', categoryRef.id);
    return categoryRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Function to add an item in Firebase
export const addItem = async (categoryId, itemName, maxAmount, picture) => {
  try {
    const itemRef = await addDoc(collection(db, 'items'), {
      name: itemName,
      maxAmount: maxAmount,
      picture: picture,
      categoryId: categoryId,
    });
    console.log('Item added:', itemRef.id);
    return itemRef.id;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

// Function to fetch user organizations
export const fetchUserOrganizations = async () => {
  try {
    const q = query(collection(db, 'organizations'));
    const querySnapshot = await getDocs(q);
    const organizations = [];
    querySnapshot.forEach((doc) => {
      organizations.push({ id: doc.id, ...doc.data() });
    });
    return organizations;
  } catch (error) {
    console.error('Error fetching organizations:', error);
    throw error;
  }
};

// Function to fetch bars for an organization
export const fetchBars = async (orgId) => {
  try {
    const q = query(collection(db, 'bars'), where('orgId', '==', orgId));
    const querySnapshot = await getDocs(q);
    const bars = [];
    querySnapshot.forEach((doc) => {
      bars.push({ id: doc.id, ...doc.data() });
    });
    return bars;
  } catch (error) {
    console.error('Error fetching bars:', error);
    throw error;
  }
};

export const fetchBarsByOrgId = async (orgId) => {
  try {
    const q = query(collection(db, 'bars'), where('orgId', '==', orgId));
    const querySnapshot = await getDocs(q);
    const bars = [];
    querySnapshot.forEach((doc) => {
      bars.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Fetched bars for organization ${orgId}:`, bars);
    return bars;
  } catch (error) {
    console.error('Error fetching bars:', error);
    throw error;
  }
};

// Function to fetch categories for a bar
export const fetchCategories = async (barId) => {
  try {
    const q = query(collection(db, 'categories'), where('barId', '==', barId));
    const querySnapshot = await getDocs(q);
    const categories = [];
    querySnapshot.forEach((doc) => {
      categories.push({ id: doc.id, ...doc.data() });
    });
    console.log(`Fetched categories for bar ${barId}:`, JSON.stringify(categories, null, 2));
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

// Function to fetch items for a category
export const fetchItems = async (categoryId) => {
  try {
    const q = query(collection(db, 'items'), where('categoryId', '==', categoryId));
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    console.error('Error fetching items:', error);
    throw error;
  }
};

// Function to log all local storage data
export const logLocalStorage = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const relevantKeys = allKeys.filter(key =>
      key.includes('organizations') || 
      key.includes('bars') || 
      key.includes('categories') || 
      key.includes('items')
    );

    const relevantItems = await AsyncStorage.multiGet(relevantKeys);

    relevantItems.forEach((item) => {
      const key = item[0];
      const value = JSON.parse(item[1]);

      console.log(`\n===== ${key.toUpperCase()} =====`);

      if (key.includes('organizations')) {
        value.forEach(org => {
          console.log(`Organization ID: ${org.id}`);
          console.log(`Name: ${org.name}`);
          console.log(`Created By: ${org.createdBy}`);
          console.log('-------------------------');
        });
      } else if (key.includes('bars')) {
        value.forEach(bar => {
          console.log(`Bar Name: ${bar.name}`);
          console.log(`Shelves: ${bar.numShelves}`);
          console.log(`Fridges: ${bar.numFridges}`);
          console.log(`Organization ID: ${bar.orgId}`);
          console.log('-------------------------');
        });
      } else if (key.includes('categories')) {
        value.forEach(category => {
          console.log(`Category Name: ${category.name}`);
          console.log(`Organization ID: ${category.orgId}`);
          console.log('-------------------------');
        });
      } else if (key.includes('items')) {
        value.forEach(item => {
          console.log(`Item Name: ${item.name}`);
          console.log(`Max Amount: ${item.maxAmount}`);
          console.log(`Category Name: ${item.categoryName}`);
          console.log('-------------------------');
        });
      }
    });
  } catch (error) {
    console.error('Error logging local storage:', error);
  }
};




export const uploadBarsToFirebase = async (orgId, bars) => {
  try {
    for (const bar of bars) {
      if (bar.orgId === orgId) {
        await createBarInFirebase(orgId, bar);
      }
    }
  } catch (error) {
    console.error('Error uploading bars:', error);
    throw error;
  }
};

