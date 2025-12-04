import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type StudentParent = {
    id: string;
    student_id: string;
    name: string;
    relationship: 'mother' | 'father' | 'guardian';
    phone: string;
    email?: string;
    is_primary: boolean;
    created_at?: any;
};

export function useStudentParents(studentId?: string) {
    const [parents, setParents] = useState<StudentParent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) {
            setParents([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'student_parents'),
            where('student_id', '==', studentId)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const parentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as StudentParent[];
            setParents(parentsData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Veli listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studentId]);

    const addParent = async (parentData: Omit<StudentParent, 'id' | 'created_at'>) => {
        try {
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(parentData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await addDoc(collection(db, 'student_parents'), {
                ...sanitizedData,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add parent error:', err);
            throw new Error('Veli eklenirken bir hata oluştu.');
        }
    };

    const updateParent = async (id: string, parentData: Partial<StudentParent>) => {
        try {
            const parentRef = doc(db, 'student_parents', id);
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(parentData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(parentRef, sanitizedData);
        } catch (err: any) {
            console.error('Update parent error:', err);
            throw new Error('Veli güncellenirken bir hata oluştu.');
        }
    };

    const deleteParent = async (id: string) => {
        try {
            const parentRef = doc(db, 'student_parents', id);
            await deleteDoc(parentRef);
        } catch (err: any) {
            console.error('Delete parent error:', err);
            throw new Error('Veli silinirken bir hata oluştu.');
        }
    };

    const setPrimary = async (id: string, studentId: string) => {
        try {
            // First, unset all primary flags for this student
            const allParents = parents.filter(p => p.student_id === studentId);
            for (const parent of allParents) {
                if (parent.is_primary) {
                    await updateParent(parent.id, { is_primary: false });
                }
            }
            // Then set the new primary
            await updateParent(id, { is_primary: true });
        } catch (err: any) {
            console.error('Set primary error:', err);
            throw new Error('Birincil veli ayarlanamadı.');
        }
    };

    return {
        parents,
        loading,
        error,
        addParent,
        updateParent,
        deleteParent,
        setPrimary
    };
}
