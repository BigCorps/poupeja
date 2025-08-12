import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

// Define the type for a category
export interface Category {
  id?: string;
  name: string;
  type: 'expense' | 'income';
  description: string;
}

// Global variables provided by the Canvas environment
declare const __firebase_config: string;
declare const __initial_auth_token: string;
declare const __app_id: string;

const firebaseConfig = JSON.parse(__firebase_config);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

/**
 * Custom hook to manage categories in Firestore.
 * Provides real-time updates and functions to add, update, and delete categories.
 */
export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [db, setDb] = useState<any>(null);
  const [auth, setAuth] = useState<any>(null);

  useEffect(() => {
    // 1. Initialize Firebase services
    const app = initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const firebaseAuth = getAuth(app);
    setDb(firestore);
    setAuth(firebaseAuth);
    
    // 2. Handle user authentication state
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        try {
          // Sign in using the provided custom token or anonymously if not available
          if (typeof __initial_auth_token !== 'undefined') {
            await signInWithCustomToken(firebaseAuth, __initial_auth_token);
          } else {
            await signInAnonymously(firebaseAuth);
          }
        } catch (authError: any) {
          console.error("Failed to sign in:", authError);
          setError("Failed to authenticate with Firebase.");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // 3. Set up Firestore listener after authentication
    if (!db || !user) {
      return;
    }

    const userId = user.uid;
    const categoriesCollectionRef = collection(db, `artifacts/${appId}/users/${userId}/categories`);
    const q = query(categoriesCollectionRef);
    
    // Listen for real-time changes using onSnapshot
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedCategories: Category[] = [];
      querySnapshot.forEach((doc: QueryDocumentSnapshot<DocumentData>) => {
        fetchedCategories.push({ id: doc.id, ...doc.data() } as Category);
      });
      setCategories(fetchedCategories);
    }, (snapshotError: any) => {
      console.error("Error fetching categories:", snapshotError);
      setError("Failed to fetch categories.");
    });
    
    // Clean up the listener on component unmount
    return () => unsubscribe();
  }, [db, user]);

  /**
   * Adds a new category to Firestore.
   */
  const addCategory = useCallback(async (newCategory: Omit<Category, 'id'>) => {
    if (!db || !user) return;
    try {
      const categoriesCollectionRef = collection(db, `artifacts/${appId}/users/${user.uid}/categories`);
      await addDoc(categoriesCollectionRef, newCategory);
    } catch (opError: any) {
      console.error("Error adding category:", opError);
      setError("Failed to add category.");
    }
  }, [db, user]);

  /**
   * Updates an existing category in Firestore.
   */
  const updateCategory = useCallback(async (id: string, updatedData: Partial<Category>) => {
    if (!db || !user || !id) return;
    try {
      const categoryDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/categories`, id);
      await updateDoc(categoryDocRef, updatedData);
    } catch (opError: any) {
      console.error("Error updating category:", opError);
      setError("Failed to update category.");
    }
  }, [db, user]);

  /**
   * Deletes a category from Firestore.
   */
  const deleteCategory = useCallback(async (id: string) => {
    if (!db || !user || !id) return;
    try {
      const categoryDocRef = doc(db, `artifacts/${appId}/users/${user.uid}/categories`, id);
      await deleteDoc(categoryDocRef);
    } catch (opError: any) {
      console.error("Error deleting category:", opError);
      setError("Failed to delete category.");
    }
  }, [db, user]);

  return { categories, loading, error, addCategory, updateCategory, deleteCategory };
};

export default useCategories;
