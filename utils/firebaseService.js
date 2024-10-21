import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where, setDoc, doc, getDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';

// Function to create or update an organization in Firebase
export const createOrUpdateOrganization = async (name) => {
  console.log("hello")
  try {
    const currentUser = auth.currentUser;  // Get the currently logged-in user
    const userEmail = currentUser.email;   // Get the user's email

    // Query Firestore to find the document in 'users' collection where the email matches
    const q = query(collection(db, 'users'), where('email', '==', userEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('User document does not exist.');
    }

    let userCode = null;
    querySnapshot.forEach((doc) => {
      userCode = doc.data().code;  // Get the user's unique code
    });

    if (!userCode) {
      throw new Error('User code does not exist.');
    }

    // Log the user's code
    console.log('User code:', userCode);  

    // Now create or update the organization, including the user's code
    const orgRef = doc(db, 'organizations', name);
    await setDoc(orgRef, {
      name,
      createdBy: userEmail,
      code: userCode  // Include the user's unique code in the organization document
    }, { merge: true });

    return orgRef.id;
  } catch (error) {
    console.error('Error creating/updating organization:', error);
    throw error;
  }
};

export const createBarInFirebase = async (orgId, bar) => {
  try {
    const barRef = doc(db, 'organizations', orgId, 'bars', bar.name);
    await setDoc(barRef, {
      name: bar.name,
      numShelves: bar.numShelves,
      numFridges: bar.numFridges,
      orgId: bar.orgId,
      color: bar.color || '#FFFFFF',
    }, { merge: true });
    return barRef.id;
  } catch (error) {
    console.error('Error creating bar:', error);
    throw error;
  }
};


export const addCategory = async (orgId, categoryName) => {
  try {
    const categoryRef = doc(db, 'organizations', orgId, 'categories', categoryName);  // Categories under organizations, no barId
    await setDoc(categoryRef, {
      name: categoryName,
      orgId: orgId,  // Store orgId
    }, { merge: true });
    return categoryRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

export const addItem = async (orgId, categoryName, itemName, maxAmount, image) => {
  try {
    const itemRef = doc(db, 'organizations', orgId, 'categories', categoryName, 'items', itemName);  // Items under categories by name
    await setDoc(itemRef, {
      name: itemName,
      maxAmount,
      image: image || null,
      categoryName: categoryName,  // Store categoryName
    }, { merge: true });
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};




// Function to fetch user organizations
export const fetchUserOrganizations = async () => {
  try {
    const currentUser = auth.currentUser;  // Get the currently logged-in user
    const q = query(collection(db, 'organizations'), where('createdBy', '==', currentUser.email));
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

export const deleteAllBars = async (orgId) => {
  try {
    const barsSnapshot = await getDocs(collection(db, 'organizations', orgId, 'bars'));
    barsSnapshot.forEach(async (barDoc) => {
      await deleteAllCategories(barDoc.id);  // Delete all categories for the bar
      await deleteDoc(doc(db, 'organizations', orgId, 'bars', barDoc.id));  // Then delete the bar
    });
    console.log(`All bars deleted for organization: ${orgId}`);
  } catch (error) {
    console.error('Error deleting bars:', error);
    throw error;
  }
};

// Function to delete all categories for each bar
export const deleteAllCategories = async (barId) => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, 'bars', barId, 'categories'));
    categoriesSnapshot.forEach(async (categoryDoc) => {
      await deleteAllItems(categoryDoc.id);  // Delete all items for the category
      await deleteDoc(doc(db, 'bars', barId, 'categories', categoryDoc.id));  // Then delete the category
    });
    console.log(`All categories deleted for bar: ${barId}`);
  } catch (error) {
    console.error('Error deleting categories:', error);
    throw error;
  }
};

// Function to delete all items for each category
export const deleteAllItems = async (categoryId) => {
  try {
    const itemsSnapshot = await getDocs(collection(db, 'categories', categoryId, 'items'));
    itemsSnapshot.forEach(async (itemDoc) => {
      await deleteDoc(doc(db, 'categories', categoryId, 'items', itemDoc.id));  // Delete each item
    });
    console.log(`All items deleted for category: ${categoryId}`);
  } catch (error) {
    console.error('Error deleting items:', error);
    throw error;
  }
};

export const checkAndAssignUserCode = async (userId) => {
  const currentUser = auth.currentUser;  // Get the current logged-in user
  const userRef = doc(db, 'users', userId);  // Reference to the user's document in Firestore
  const userDoc = await getDoc(userRef);  // Fetch the user document from Firestore

  // If the user does not have a Firestore document, create it
  if (!userDoc.exists()) {
    await setDoc(userRef, {
      email: currentUser.email,  // Store the user's email
      code: null  // Set code to null initially, it will be assigned below
    });
  }

  let userData = userDoc.data();

  // Check if the user already has a code
  if (!userData || !userData.code) {
    let uniqueCode;
    let codeExists = true;

    // Generate a unique 6-digit code
    while (codeExists) {
      uniqueCode = Math.floor(100000 + Math.random() * 900000).toString();  // Generates a 6-digit number

      // Check if this code already exists in the users collection
      const querySnapshot = await getDocs(query(collection(db, 'users'), where('code', '==', uniqueCode)));

      if (querySnapshot.empty) {
        codeExists = false;  // The code is unique
      }
    }

    // Save the new code in the user's Firestore document
    await setDoc(userRef, { code: uniqueCode }, { merge: true });  // Merge with existing data (e.g., email)
  }

  return userData?.code || uniqueCode;
};





