import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { uploadImageToCloudinary } from '../lib/cloudinary';

export type Teacher = {
    id: string;
    name: string;
    role: string;
    phone: string;
    email?: string;
    start_date: string;
    salary?: number;
    notes?: string;
    photo_url?: string;
    is_active: boolean;
    created_at?: any;
};

export function useTeachers() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'teachers'),
            where('is_active', '==', true),
            orderBy('name')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const teachersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Teacher[];
            setTeachers(teachersData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Personel listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addTeacher = useCallback(async (teacherData: Omit<Teacher, 'id' | 'is_active' | 'created_at'>, photoFile?: File) => {
        try {
            let photo_url = '';
            if (photoFile) {
                photo_url = await uploadImageToCloudinary(photoFile);
            }

            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(teacherData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await addDoc(collection(db, 'teachers'), {
                ...sanitizedData,
                photo_url,
                is_active: true,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add teacher error:', err);
            throw new Error('Personel eklenirken bir hata oluştu.');
        }
    }, []);

    const updateTeacher = useCallback(async (id: string, teacherData: Partial<Teacher>, photoFile?: File) => {
        try {
            let updateData = { ...teacherData };

            if (photoFile) {
                const photo_url = await uploadImageToCloudinary(photoFile);
                updateData.photo_url = photo_url;
            }

            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(updateData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            const teacherRef = doc(db, 'teachers', id);
            await updateDoc(teacherRef, sanitizedData);
        } catch (err: any) {
            console.error('Update teacher error:', err);
            throw new Error('Personel güncellenirken bir hata oluştu.');
        }
    }, []);

    const deleteTeacher = useCallback(async (id: string) => {
        try {
            const teacherRef = doc(db, 'teachers', id);
            await updateDoc(teacherRef, { is_active: false });
        } catch (err: any) {
            console.error('Delete teacher error:', err);
            throw new Error('Personel silinirken bir hata oluştu.');
        }
    }, []);

    return useMemo(() => ({
        teachers,
        loading,
        error,
        addTeacher,
        updateTeacher,
        deleteTeacher
    }), [teachers, loading, error, addTeacher, updateTeacher, deleteTeacher]);
}
