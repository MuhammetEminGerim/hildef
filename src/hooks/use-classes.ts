import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type Class = {
    id: string;
    name: string;
    capacity: number;
    age_group: string;
    teacher_id?: string | null;
    description?: string;
    is_active: boolean;
    created_at?: any;
};

export function useClasses() {
    const [classes, setClasses] = useState<Class[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'classes'),
            where('is_active', '==', true),
            orderBy('name')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const classesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Class[];
            setClasses(classesData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Sınıf listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addClass = async (classData: Omit<Class, 'id' | 'is_active' | 'created_at'>) => {
        try {
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(classData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await addDoc(collection(db, 'classes'), {
                ...sanitizedData,
                is_active: true,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add class error:', err);
            throw new Error('Sınıf eklenirken bir hata oluştu.');
        }
    };

    const updateClass = async (id: string, classData: Partial<Class>) => {
        try {
            const classRef = doc(db, 'classes', id);
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(classData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(classRef, sanitizedData);
        } catch (err: any) {
            console.error('Update class error:', err);
            throw new Error('Sınıf güncellenirken bir hata oluştu.');
        }
    };

    const deleteClass = async (id: string) => {
        try {
            const classRef = doc(db, 'classes', id);
            await updateDoc(classRef, { is_active: false });
        } catch (err: any) {
            console.error('Delete class error:', err);
            throw new Error('Sınıf silinirken bir hata oluştu.');
        }
    };

    return {
        classes,
        loading,
        error,
        addClass,
        updateClass,
        deleteClass
    };
}
