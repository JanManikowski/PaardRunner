import { db } from '../utils/firebaseConfig';  // Import Firebase Firestore instance from config
import { doc, setDoc, addDoc, collection, updateDoc, getDocs, arrayUnion, getDoc } from 'firebase/firestore';  // Add getDoc here
import { auth } from '../utils/firebaseConfig';  // Import Firebase auth if needed for current user

export const createOrganization = async (orgName, adminEmail) => {
    try {
        console.log({
            name: orgName,
            admins: [adminEmail],
            categories: [],
         });
      // Add the organization to Firestore
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name: orgName,  // Store the organization name here
        admins: [adminEmail],  // Store the admin's email
        categories: [],  // Initialize categories as an empty array
      });
  
      // Update user document to link the organization
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userRef, {
        organizations: arrayUnion(orgRef.id),  // Add organization ID to user's organizations array
      }, { merge: true });
  
      console.log('Organization created with ID:', orgRef.id);
      return orgRef.id;  // Return the organization ID if needed
    } catch (error) {
      console.error('Error creating organization:', error);
      throw error;
    }
  };

// Function to add a category to an organization
export const addCategory = async (orgId, categoryName) => {
  try {
    const categoryRef = await addDoc(collection(db, `organizations/${orgId}/categories`), {
      name: categoryName,
      items: [],
    });

    // Optionally, you can add the category reference to the organization document
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      categories: arrayUnion(categoryRef.id),
    });

    console.log('Category added:', categoryRef.id);
    return categoryRef.id;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
};

// Function to add an item to a category
export const addItem = async (orgId, categoryId, itemName, maxAmount, picture) => {
  try {
    const itemRef = await addDoc(collection(db, `organizations/${orgId}/categories/${categoryId}/items`), {
      name: itemName,
      maxAmount: maxAmount,
      picture: picture,
    });

    console.log('Item added:', itemRef.id);
    return itemRef.id;
  } catch (error) {
    console.error('Error adding item:', error);
    throw error;
  }
};

// Function to export data from an organization
export const exportData = async (orgId) => {
  try {
    const categoriesSnapshot = await getDocs(collection(db, `organizations/${orgId}/categories`));
    
    const categories = [];
    for (const categoryDoc of categoriesSnapshot.docs) {
      const categoryData = categoryDoc.data();
      const itemsSnapshot = await getDocs(collection(db, `organizations/${orgId}/categories/${categoryDoc.id}/items`));

      const items = [];
      itemsSnapshot.forEach((itemDoc) => {
        items.push(itemDoc.data());
      });

      categories.push({
        ...categoryData,
        items: items
      });
    }

    const orgData = {
      categories: categories,
    };

    console.log('Exported data:', orgData);
    return orgData;
  } catch (error) {
    console.error('Error exporting data:', error);
    throw error;
  }
};

// Function to fetch user's organizations
export const fetchUserOrganizations = async () => {
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnapshot = await getDoc(userRef);
  
      if (userSnapshot.exists()) {
        const orgIds = userSnapshot.data().organizations || [];
        
        // Fetch each organization by ID to get the name
        const organizations = [];
        for (let orgId of orgIds) {
          const orgRef = doc(db, 'organizations', orgId);
          const orgSnapshot = await getDoc(orgRef);
          if (orgSnapshot.exists()) {
            organizations.push({
              id: orgId,  // Keep track of the org ID
              ...orgSnapshot.data(),  // Spread the organization data
            });
          }
        }
        return organizations;
      }
      return [];
    } catch (error) {
      console.error('Error fetching user organizations:', error);
      throw error;
    }
  };

  
