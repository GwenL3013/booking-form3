import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

export const recreateAuthUser = async (email, password) => {
    try {
        // First, try to find the user in Firestore
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            throw new Error('No user found with this email in the database');
        }

        // Get the first matching user document
        const userDoc = querySnapshot.docs[0];
        const existingUid = userDoc.id;
        const userData = userDoc.data();

        // Try to sign in first
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return userCredential.user;
        } catch (signInError) {
            // If sign in fails, try to create a new user
            if (signInError.code === 'auth/user-not-found') {
                // Create new auth user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Update the user's profile with data from Firestore
                await userCredential.user.updateProfile({
                    displayName: userData.displayName || '',
                    photoURL: userData.photoURL || ''
                });

                // Create a new document in Firestore with the new UID
                const newUserRef = doc(db, 'users', userCredential.user.uid);
                await setDoc(newUserRef, {
                    ...userData,
                    originalUid: existingUid, // Store the original UID for reference
                    migratedAt: new Date().toISOString()
                });

                // Update all references to the old UID in other collections
                const collectionsToUpdate = ['bookings', 'travelDiaries', 'todos', 'communityFeed'];
                for (const collectionName of collectionsToUpdate) {
                    const collectionRef = collection(db, collectionName);
                    const collectionQuery = query(collectionRef, where('userId', '==', existingUid));
                    const docs = await getDocs(collectionQuery);
                    
                    for (const doc of docs.docs) {
                        const newDocRef = doc(db, collectionName, doc.id);
                        const docData = doc.data();
                        await setDoc(newDocRef, {
                            ...docData,
                            userId: userCredential.user.uid
                        });
                    }
                }

                // Delete the old user document
                await deleteDoc(doc(db, 'users', existingUid));

                return userCredential.user;
            }
            throw signInError;
        }
    } catch (error) {
        console.error('Error recreating auth user:', error);
        throw error;
    }
}; 