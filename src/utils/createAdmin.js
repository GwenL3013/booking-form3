import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const createAdminUser = async (email, password) => {
    try {
        // Create the user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Add the user document with admin role to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            role: 'admin',
            createdAt: new Date().toISOString()
        });

        console.log('Admin user created successfully');
        return userCredential.user;
    } catch (error) {
        console.error('Error creating admin user:', error);
        throw error;
    }
};

// New function to set up existing user as admin
export const setupExistingUserAsAdmin = async (email, password) => {
    try {
        // Sign in to get the user credentials
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // Add or update the user document with admin role in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email,
            role: 'admin',
            createdAt: new Date().toISOString()
        }, { merge: true }); // merge: true will update existing document or create new one

        console.log('Existing user set up as admin successfully');
        return userCredential.user;
    } catch (error) {
        console.error('Error setting up existing user as admin:', error);
        throw error;
    }
}; 