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
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type StudentVaccination = {
    id: string;
    student_id: string;
    vaccine_name: string;
    vaccine_date: string;
    next_dose_date?: string;
    notes?: string;
    created_at?: any;
};

export function useStudentVaccinations(studentId?: string) {
    const [vaccinations, setVaccinations] = useState<StudentVaccination[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) {
            setVaccinations([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'student_vaccinations'),
            where('student_id', '==', studentId),
            orderBy('vaccine_date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const vaccinationsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as StudentVaccination[];
            setVaccinations(vaccinationsData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Aşı listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studentId]);

    const addVaccination = async (vaccinationData: Omit<StudentVaccination, 'id' | 'created_at'>) => {
        try {
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(vaccinationData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await addDoc(collection(db, 'student_vaccinations'), {
                ...sanitizedData,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add vaccination error:', err);
            throw new Error('Aşı eklenirken bir hata oluştu.');
        }
    };

    const updateVaccination = async (id: string, vaccinationData: Partial<StudentVaccination>) => {
        try {
            const vaccinationRef = doc(db, 'student_vaccinations', id);
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(vaccinationData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(vaccinationRef, sanitizedData);
        } catch (err: any) {
            console.error('Update vaccination error:', err);
            throw new Error('Aşı güncellenirken bir hata oluştu.');
        }
    };

    const deleteVaccination = async (id: string) => {
        try {
            const vaccinationRef = doc(db, 'student_vaccinations', id);
            await deleteDoc(vaccinationRef);
        } catch (err: any) {
            console.error('Delete vaccination error:', err);
            throw new Error('Aşı silinirken bir hata oluştu.');
        }
    };

    return {
        vaccinations,
        loading,
        error,
        addVaccination,
        updateVaccination,
        deleteVaccination
    };
}
