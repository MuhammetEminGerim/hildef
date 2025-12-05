import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Payment, PaymentStatus } from '../lib/types';

export { type Payment, type PaymentStatus };

export function usePayments() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'payments'),
            orderBy('due_date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const paymentsData = snapshot.docs.map(doc => {
                const data = doc.data();
                // Auto-update overdue status
                const dueDate = new Date(data.due_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let status = data.status;
                if ((status === 'Pending' || status === 'Partial') && dueDate < today) {
                    status = 'Overdue';
                }

                return {
                    id: doc.id,
                    ...data,
                    status
                } as Payment;
            })
                .filter(payment => payment.is_active !== false); // Client-side filter for soft delete

            setPayments(paymentsData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Ödeme listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addPayment = async (paymentData: Omit<Payment, 'id' | 'created_at'>) => {
        try {
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(paymentData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await addDoc(collection(db, 'payments'), {
                ...sanitizedData,
                is_active: true, // Mark as active
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add payment error:', err);
            throw new Error('Ödeme eklenirken bir hata oluştu.');
        }
    };

    const updatePayment = async (id: string, paymentData: Partial<Payment>) => {
        try {
            const paymentRef = doc(db, 'payments', id);
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(paymentData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(paymentRef, sanitizedData);
        } catch (err: any) {
            console.error('Update payment error:', err);
            throw new Error('Ödeme güncellenirken bir hata oluştu.');
        }
    };

    const deletePayment = async (id: string) => {
        try {
            const paymentRef = doc(db, 'payments', id);
            // Soft delete instead of hard delete
            await updateDoc(paymentRef, { is_active: false });
        } catch (err: any) {
            console.error('Delete payment error:', err);
            throw new Error('Ödeme silinirken bir hata oluştu.');
        }
    };

    return {
        payments,
        loading,
        error,
        addPayment,
        updatePayment,
        deletePayment
    };
}
