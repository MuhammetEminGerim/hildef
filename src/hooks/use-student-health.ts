import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    where,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type StudentHealth = {
    id: string;
    student_id: string;
    chronic_diseases?: string;
    allergies?: string;
    medications?: string;
    doctor_name?: string;
    doctor_phone?: string;
    insurance_info?: string;
    notes?: string;
    created_at?: any;
    updated_at?: any;
};

export function useStudentHealth(studentId?: string) {
    const [health, setHealth] = useState<StudentHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) {
            setHealth(null);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'student_health'),
            where('student_id', '==', studentId),
            limit(1)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (snapshot.empty) {
                setHealth(null);
            } else {
                const doc = snapshot.docs[0];
                setHealth({
                    id: doc.id,
                    ...doc.data()
                } as StudentHealth);
            }
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Sağlık bilgisi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studentId]);

    const saveHealth = async (healthData: Omit<StudentHealth, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(healthData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            if (health) {
                // Update existing
                const healthRef = doc(db, 'student_health', health.id);
                await updateDoc(healthRef, {
                    ...sanitizedData,
                    updated_at: serverTimestamp()
                });
            } else {
                // Create new
                await addDoc(collection(db, 'student_health'), {
                    ...sanitizedData,
                    created_at: serverTimestamp(),
                    updated_at: serverTimestamp()
                });
            }
        } catch (err: any) {
            console.error('Save health error:', err);
            throw new Error('Sağlık bilgisi kaydedilemedi.');
        }
    };

    return {
        health,
        loading,
        error,
        saveHealth
    };
}
