import { db } from './firebaseConfig';
import { collection, addDoc, getDocs, query, where, setDoc, doc, getDoc, Firestore, deleteDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from './firebaseConfig';
import firebase from 'firebase/app';
import 'firebase/firestore';

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
    const categoryRef = doc(db, 'organizations', orgId, `categories_${orgId}`, categoryName);  // Categories under organizations, no barId
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
    const itemRef = doc(
      db,
      'organizations',
      orgId,
      `categories_${orgId}`,
      categoryName,
      `items_${orgId}`,
      itemName
    );

    await setDoc(
      itemRef,
      {
        name: itemName,
        maxAmount,
        image: image || null,
        categoryName,
      },
      { merge: true }
    );

    // Update AsyncStorage after adding the item to Firebase
    const storageKey = `categories_${orgId}`;
    const storedCategories = JSON.parse(await AsyncStorage.getItem(storageKey)) || [];

    const updatedCategories = storedCategories.map(cat => {
      if (cat.name === categoryName) {
        const existingItems = cat.items || [];
        
        // Check if item already exists to avoid duplicates
        const itemExists = existingItems.some(item => item.name === itemName);
        
        const updatedItems = itemExists
          ? existingItems.map(item => item.name === itemName ? { name: itemName, maxAmount, image } : item)
          : [...existingItems, { name: itemName, maxAmount, image }];
        
        return { ...cat, items: updatedItems };
      }
      return cat;
    });

    // Save updated categories back to AsyncStorage
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedCategories));
    
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
      console.log(value);
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

// Fetch all bars for this organization
export const fetchOrganizationsByCode = async (code) => {
  try {
    // Fetch organizations matching the given code
    const orgQuery = query(collection(db, 'organizations'), where('code', '==', code));
    const organizationsSnapshot = await getDocs(orgQuery);

    if (organizationsSnapshot.empty) {
      console.log("No organizations found with the provided code.");
      return [];
    }
    
    const organizations = [];
    
    for (const orgDoc of organizationsSnapshot.docs) {
      console.log("Processing organization document with id:", orgDoc.id);
      const orgData = { id: orgDoc.id, ...orgDoc.data() };
      console.log("Fetched organization:", orgData);
    
      // Fetch bars for this organization
      const barsRef = collection(db, 'organizations', orgData.id, 'bars');
      console.log("Fetching bars from path:", barsRef.path);
      const barsSnapshot = await getDocs(barsRef);
      console.log("Bars snapshot size:", barsSnapshot.size);
      const bars = [];
      for (const barDoc of barsSnapshot.docs) {
        const barData = { id: barDoc.id, ...barDoc.data() };
        console.log("Bar fetched:", barData);
        bars.push(barData);
      }
      if (bars.length > 0) {
        await AsyncStorage.setItem(`bars_${orgData.id}`, JSON.stringify(bars));
        console.log(`Bars saved to AsyncStorage for organization ID: ${orgData.id}`);
      } else {
        console.log(`No bars found for organization ID: ${orgData.id}`);
      }
      orgData.bars = bars;
    
      // Fetch crates for this organization
      const cratesRef = collection(db, 'organizations', orgData.id, 'crates');
    const cratesSnapshot = await getDocs(cratesRef);
    const crates = cratesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log("Fetched crates for org:", orgData.id, crates);

    // 🔹 Store in AsyncStorage
    if (crates.length > 0) {
        await AsyncStorage.setItem(`customCrates_${orgData.id}`, JSON.stringify(crates));
        console.log(`Crates saved in AsyncStorage for org: ${orgData.id}`);
    } else {
        console.log(`No crates found for org: ${orgData.id}`);
    }
    
      // Fetch categories (and items) for this organization
      const categoriesRef = collection(db, 'organizations', orgData.id, `categories_${orgData.id}`);
      console.log("Fetching categories from path:", categoriesRef.path);
      const categoriesSnapshot = await getDocs(categoriesRef);
      console.log("Categories snapshot size:", categoriesSnapshot.size);
      const categories = [];
      for (const categoryDoc of categoriesSnapshot.docs) {
        const categoryData = { id: categoryDoc.id, ...categoryDoc.data() };
        console.log("Category fetched:", categoryData);
    
        // Use the category name (or fallback to id) for the items collection path
        const categoryIdentifier = categoryData.name || categoryData.id;
        const itemsRef = collection(db, 'organizations', orgData.id, `categories_${orgData.id}`, categoryIdentifier, `items_${orgData.id}`);
        console.log("Fetching items from path:", itemsRef.path);
        const itemsSnapshot = await getDocs(itemsRef);
        console.log("Items snapshot size for category", categoryIdentifier, ":", itemsSnapshot.size);
        const items = [];
        itemsSnapshot.forEach((itemDoc) => {
          const itemData = { id: itemDoc.id, ...itemDoc.data() };
          console.log("Item fetched:", itemData);
          items.push(itemData);
        });
        categoryData.items = items;
        categories.push(categoryData);
      }
      orgData.categories = categories;
      if (categories.length > 0) {
        await AsyncStorage.setItem(`categories_${orgData.id}`, JSON.stringify(categories));
        console.log(`Categories saved to AsyncStorage for organization ID: ${orgData.id}`);
      } else {
        console.log(`No categories found for organization ID: ${orgData.id}`);
      }
    
      organizations.push(orgData);
    }
    
    console.log("Complete organization data fetched:", JSON.stringify(organizations, null, 2));
    return organizations;
    
  } catch (error) {
    console.error('Error fetching organizations by code:', error);
    throw error;
  }
};



export const deleteOrganization = async (orgId) => {
    try {
        // Delete all associated bars, categories, and items under the organization
        const barsSnapshot = await getDocs(collection(db, 'organizations', orgId, 'bars'));
        for (const bar of barsSnapshot.docs) {
            const categoriesSnapshot = await getDocs(collection(db, 'organizations', orgId, 'bars', bar.id, 'categories'));
            for (const category of categoriesSnapshot.docs) {
                const itemsSnapshot = await getDocs(
                    collection(db, 'organizations', orgId, 'bars', bar.id, 'categories', category.id, 'items')
                );
                for (const item of itemsSnapshot.docs) {
                    await deleteDoc(item.ref); // Delete each item
                }
                await deleteDoc(category.ref); // Delete each category
            }
            await deleteDoc(bar.ref); // Delete each bar
        }

        // Delete the organization document itself
        await deleteDoc(doc(db, 'organizations', orgId));
        console.log(`Organization with ID ${orgId} and all associated data deleted.`);
    } catch (error) {
        console.error('Error deleting organization:', error);
        throw error;
    }
};


export const handleDeleteOrganization = async (orgId) => {
  Alert.alert(
    'Confirm Delete',
    'Are you sure you want to delete this organization? This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'OK',
        onPress: async () => {
          try {
            // Delete from Firebase
            await deleteOrganization(orgId);

            // Delete from local storage
            const organizations = JSON.parse(await AsyncStorage.getItem('organizations')) || [];
            const updatedOrganizations = organizations.filter((org) => org.id !== orgId);
            await AsyncStorage.setItem('organizations', JSON.stringify(updatedOrganizations));

            // Clear activeOrgId if it matches the deleted org
            const activeOrgId = await AsyncStorage.getItem('activeOrgId');
            if (activeOrgId === orgId) {
              await AsyncStorage.removeItem('activeOrgId');
              setActiveOrgId(null);
            }

            Alert.alert('Success', 'Organization deleted successfully.');
            loadOrganizations(); // Refresh the list of organizations
          } catch (error) {
            console.error('Error deleting organization:', error);
            Alert.alert('Error', 'Failed to delete organization.');
          }
        },
      },
    ]
  );
};

export const addCrateToFirebase = async (orgId, crate) => {
  try {
      const crateRef = doc(db, 'organizations', orgId, 'crates', crate.name);
      await setDoc(crateRef, {
          name: crate.name,
          category: crate.category,
          maxItems: crate.maxItems,
          orgId: orgId,
      }, { merge: true });

      console.log(`Crate "${crate.name}" uploaded to organization ${orgId}`);
  } catch (error) {
      console.error('Error adding crate:', error);
      throw error;
  }
};


export const deleteAllDataUnderOrganization = async (orgId) => {
  try {
    // Delete bars
    const barsSnapshot = await getDocs(collection(db, 'organizations', orgId, 'bars'));
    for (const barDoc of barsSnapshot.docs) {
      await deleteDoc(barDoc.ref);
      console.log('Deleted bar:', barDoc.id);
    }

    // Delete categories and items
    const categoriesSnapshot = await getDocs(collection(db, 'organizations', orgId, `categories_${orgId}`));
    for (const categoryDoc of categoriesSnapshot.docs) {
      // Delete items inside each category
      const itemsSnapshot = await getDocs(collection(db, 'organizations', orgId, `categories_${orgId}`, categoryDoc.id, `items_${orgId}`));
      for (const itemDoc of itemsSnapshot.docs) {
        await deleteDoc(itemDoc.ref);
        console.log('Deleted item:', itemDoc.id);
      }

      // Delete category after items are deleted
      await deleteDoc(categoryDoc.ref);
      console.log('Deleted category:', categoryDoc.id);
    }

    // Optional: Delete crates if you use them
    const cratesSnapshot = await getDocs(collection(db, 'organizations', orgId, 'crates'));
    for (const crateDoc of cratesSnapshot.docs) {
      await deleteDoc(crateDoc.ref);
      console.log('Deleted crate:', crateDoc.id);
    }

    console.log(`All data under organization ${orgId} deleted successfully.`);
  } catch (error) {
    console.error('Error deleting organization data:', error);
    throw error;
  }
};




