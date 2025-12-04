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
import { uploadImageToCloudinary } from '../lib/cloudinary';
import { Student } from '../lib/types';

export function useStudents() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Real-time listener for students
        const q = query(
            collection(db, 'students'),
            where('is_active', '==', true),
            orderBy('name')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const studentsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Student[];
            setStudents(studentsData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Öğrenci listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addStudent = async (studentData: Omit<Student, 'id' | 'is_active' | 'created_at'>, photoFile?: File) => {
        try {
            let photo_url = '';
            if (photoFile) {
                photo_url = await uploadImageToCloudinary(photoFile);
            }

            await addDoc(collection(db, 'students'), {
                ...studentData,
                photo_url,
                is_active: true,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add student error:', err);
            throw new Error('Öğrenci eklenirken bir hata oluştu.');
        }
    };

    const updateStudent = async (id: string, studentData: Partial<Student>, photoFile?: File) => {
        try {
            let updateData = { ...studentData };

            if (photoFile) {
                const photo_url = await uploadImageToCloudinary(photoFile);
                updateData.photo_url = photo_url;
            }

            const studentRef = doc(db, 'students', id);
            await updateDoc(studentRef, updateData);
        } catch (err: any) {
            console.error('Update student error:', err);
            throw new Error('Öğrenci güncellenirken bir hata oluştu.');
        }
    };

    const deleteStudent = async (id: string) => {
        try {
            // Soft delete
            const studentRef = doc(db, 'students', id);
            await updateDoc(studentRef, { is_active: false });
        } catch (err: any) {
            console.error('Delete student error:', err);
            throw new Error('Öğrenci silinirken bir hata oluştu.');
        }
    };

    return {
        students,
        loading,
        error,
        addStudent,
        updateStudent,
        deleteStudent
    };
}
