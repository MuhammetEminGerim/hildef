import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { uploadImageToCloudinary } from '../lib/cloudinary';

export type StudentFile = {
    id: string;
    student_id: string;
    file_name: string;
    file_url: string; // Cloudinary URL
    file_type: 'health_report' | 'identity' | 'contract' | 'other';
    file_size?: number;
    upload_date: string;
    created_at?: any;
};

export function useStudentFiles(studentId?: string) {
    const [files, setFiles] = useState<StudentFile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!studentId) {
            setFiles([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'student_files'),
            where('student_id', '==', studentId),
            orderBy('upload_date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const filesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as StudentFile[];
            setFiles(filesData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Dosya listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studentId]);

    const addFile = async (
        studentId: string,
        file: File,
        fileType: StudentFile['file_type']
    ) => {
        try {
            // Upload to Cloudinary
            const file_url = await uploadImageToCloudinary(file);

            import { getLocalToday } from '../lib/utils';

            // ... existing imports

            // Save to Firestore
            await addDoc(collection(db, 'student_files'), {
                student_id: studentId,
                file_name: file.name,
                file_url,
                file_type: fileType,
                file_size: file.size,
                upload_date: getLocalToday(),
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add file error:', err);
            throw new Error('Dosya yüklenirken bir hata oluştu.');
        }
    };

    const deleteFile = async (id: string) => {
        try {
            const fileRef = doc(db, 'student_files', id);
            await deleteDoc(fileRef);
            // Note: We don't delete from Cloudinary to preserve history
        } catch (err: any) {
            console.error('Delete file error:', err);
            throw new Error('Dosya silinirken bir hata oluştu.');
        }
    };

    const openFile = (fileUrl: string) => {
        window.open(fileUrl, '_blank');
    };

    return {
        files,
        loading,
        error,
        addFile,
        deleteFile,
        openFile
    };
}
