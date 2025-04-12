// CoinContext.js
import React, { createContext, useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig'; // or wherever you initialize Firestore

export const CoinContext = createContext();

export const CoinProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Loads the user's existing balance from Firestore and sets it locally.
  const loadUserBalance = async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        if (typeof data.coins === 'number') {
          setBalance(data.coins);
        } else {
          // If the user doc doesn't have a "coins" field, you can decide a default
          setBalance(1000);
        }
      } else {
        // If no user doc yet, set balance to a default
        setBalance(1000);
      }
      setCurrentUserId(uid);
    } catch (error) {
      console.error('Error loading user balance:', error);
    }
  };

  // Whenever the balance changes, update Firestore too.
  const updateBalance = async (amount) => {
    setBalance((prev) => {
      const newBalance = prev + amount;
      if (currentUserId) {
        const userRef = doc(db, 'users', currentUserId);
        // Merge ensures we only update the 'coins' field
        setDoc(userRef, { coins: newBalance }, { merge: true })
          .catch((err) => console.error('Error updating balance in Firestore:', err));
      }
      return newBalance;
    });
  };

  // Directly set a new balance value and write to Firestore
  const setNewBalance = async (newBalance) => {
    setBalance(newBalance);
    if (currentUserId) {
      const userRef = doc(db, 'users', currentUserId);
      setDoc(userRef, { coins: newBalance }, { merge: true })
        .catch((err) => console.error('Error setting new balance in Firestore:', err));
    }
  };

  return (
    <CoinContext.Provider
      value={{
        balance,
        updateBalance,
        setNewBalance,
        loadUserBalance,
        setCurrentUserId,
      }}
    >
      {children}
    </CoinContext.Provider>
  );
};
