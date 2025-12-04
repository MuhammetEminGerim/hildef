import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    collection,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    setDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { User } from '../lib/types';

export function useUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'users'),
            orderBy('created_at', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const usersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as User[];
            setUsers(usersData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Kullanıcı listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addUser = useCallback(async (userData: { email: string; username: string; password: string; role: 'admin' | 'staff' }) => {
        try {
            // Check if running in Electron
            if (window.electronAPI) {
                const result = await window.electronAPI.invoke('users:create', userData) as { uid: string };
                return result.uid;
            }

            // Fallback for web (will sign out admin)
            // Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
            const uid = userCredential.user.uid;

            // Create Firestore user document with same ID as Auth UID
            await setDoc(doc(db, 'users', uid), {
                uid,
                email: userData.email,
                username: userData.username,
                role: userData.role,
                created_at: serverTimestamp()
            });

            // Sign out the newly created user (so admin stays logged in)
            await auth.signOut();

            // Re-authenticate admin (you'll need to handle this in the component)
            return uid;
        } catch (err: any) {
            console.error('Add user error:', err);
            if (err.code === 'auth/email-already-in-use') {
                throw new Error('Bu e-posta adresi zaten kullanılıyor.');
            } else if (err.code === 'auth/weak-password') {
                throw new Error('Şifre en az 6 karakter olmalıdır.');
            } else if (err.code === 'auth/invalid-email') {
                throw new Error('Geçersiz e-posta adresi.');
            }
            throw new Error(err.message || 'Kullanıcı eklenirken bir hata oluştu.');
        }
    }, []);

    const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
        try {
            const userRef = doc(db, 'users', id);
            // Don't allow updating uid or email through this method
            const { uid, email, created_at, ...updateData } = userData;
            await updateDoc(userRef, updateData);
        } catch (err: any) {
            console.error('Update user error:', err);
            throw new Error('Kullanıcı güncellenirken bir hata oluştu.');
        }
    }, []);

    const deleteUser = useCallback(async (id: string) => {
        try {
            // Check if running in Electron
            if (window.electronAPI) {
                // Use Electron IPC for complete deletion (Auth + Firestore)
                await window.electronAPI.invoke('users:delete-complete', id);
            } else {
                // Fallback: Only delete from Firestore (web version)
                // Note: Auth user remains, but they can't access data without Firestore doc
                const userRef = doc(db, 'users', id);
                await deleteDoc(userRef);
            }
        } catch (err: any) {
            console.error('Delete user error:', err);
            throw new Error(err.message || 'Kullanıcı silinirken bir hata oluştu.');
        }
    }, []);

    const resetPassword = useCallback(async (email: string) => {
        try {
            await sendPasswordResetEmail(auth, email);
        } catch (err: any) {
            console.error('Reset password error:', err);
            throw new Error('Şifre sıfırlama e-postası gönderilemedi.');
        }
    }, []);

    return useMemo(() => ({
        users,
        loading,
        error,
        addUser,
        updateUser,
        deleteUser,
        resetPassword
    }), [users, loading, error, addUser, updateUser, deleteUser, resetPassword]);
}
