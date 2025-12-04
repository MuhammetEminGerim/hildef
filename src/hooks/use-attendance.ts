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

export type AttendanceRecord = {
    id: string;
    student_id: string;
    date: string; // YYYY-MM-DD
    status: 'present' | 'absent' | 'late' | 'early_leave';
    notes?: string;
    created_at?: any;
};

export function useAttendance(startDate?: string, endDate?: string) {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let q;
        if (startDate && endDate) {
            q = query(
                collection(db, 'attendance'),
                where('date', '>=', startDate),
                where('date', '<=', endDate),
                orderBy('date', 'desc')
            );
        } else if (startDate) {
            q = query(
                collection(db, 'attendance'),
                where('date', '==', startDate),
                orderBy('student_id')
            );
        } else {
            q = query(
                collection(db, 'attendance'),
                orderBy('date', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const attendanceData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as AttendanceRecord[];
            setAttendance(attendanceData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Yoklama listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [startDate, endDate]);

    const addAttendance = async (attendanceData: Omit<AttendanceRecord, 'id' | 'created_at'>) => {
        try {
            await addDoc(collection(db, 'attendance'), {
                ...attendanceData,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add attendance error:', err);
            throw new Error('Yoklama eklenirken bir hata oluştu.');
        }
    };

    const updateAttendance = async (id: string, attendanceData: Partial<AttendanceRecord>) => {
        try {
            const attendanceRef = doc(db, 'attendance', id);
            await updateDoc(attendanceRef, attendanceData);
        } catch (err: any) {
            console.error('Update attendance error:', err);
            throw new Error('Yoklama güncellenirken bir hata oluştu.');
        }
    };

    const deleteAttendance = async (id: string) => {
        try {
            const attendanceRef = doc(db, 'attendance', id);
            await deleteDoc(attendanceRef);
        } catch (err: any) {
            console.error('Delete attendance error:', err);
            throw new Error('Yoklama silinirken bir hata oluştu.');
        }
    };

    return {
        attendance,
        loading,
        error,
        addAttendance,
        updateAttendance,
        deleteAttendance
    };
}
