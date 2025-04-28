import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
  TwitterAuthProvider,
  updateProfile as updateFirebaseProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { getFirestore, doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';

// Create the AuthContext
const AuthContext = createContext();
const db = getFirestore();

// Create the AuthProvider component
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);

    async function signup(email, password, role = 'user') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Create a user document with role information
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            role,
            createdAt: new Date().toISOString()
        });
        return userCredential;
    }

    async function login(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential;
        } catch (error) {
            let errorMessage = 'Failed to sign in';
            
            switch (error.code) {
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled. Please contact support.';
                    break;
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password.';
                    break;
                default:
                    errorMessage = error.message;
            }
            
            throw new Error(errorMessage);
        }
    }

    function logout() {
        setUserRole(null);
        return signOut(auth);
    }

    async function googleSignIn(role = 'user') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // Check if this is the first sign in and set role
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                email: result.user.email,
                role,
                createdAt: new Date().toISOString()
            });
        }
        return result;
    }

    async function facebookSignIn(role = 'user') {
        const provider = new FacebookAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // Check if this is the first sign in and set role
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                email: result.user.email,
                role,
                createdAt: new Date().toISOString()
            });
        }
        return result;
    }

    async function twitterSignIn(role = 'user') {
        const provider = new TwitterAuthProvider();
        const result = await signInWithPopup(auth, provider);
        // Check if this is the first sign in and set role
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
            await setDoc(doc(db, 'users', result.user.uid), {
                email: result.user.email,
                role,
                createdAt: new Date().toISOString()
            });
        }
        return result;
    }

    async function checkUserRole(uid) {
        if (!uid) return null;
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data().role;
        }
        return null;
    }

    async function updateUserProfile(userData) {
        if (!user) return;

        try {
            // Update Firebase Auth profile
            await updateFirebaseProfile(auth.currentUser, userData);

            // Update Firestore user document
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                updatedAt: new Date().toISOString()
            });

            // Update local user state
            setUser(auth.currentUser);
            
            return auth.currentUser;
        } catch (error) {
            console.error("Error updating profile:", error);
            throw error;
        }
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);
            if (currentUser) {
                const role = await checkUserRole(currentUser.uid);
                setUserRole(role);
            } else {
                setUserRole(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        user,
        userRole,
        signup,
        login,
        logout,
        googleSignIn,
        facebookSignIn,
        twitterSignIn,
        updateUserProfile,
        isAdmin: () => userRole === 'admin',
        isUser: () => userRole === 'user'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

// Create a custom hook to access the AuthContext
export function useAuth() {
    return useContext(AuthContext);
}
