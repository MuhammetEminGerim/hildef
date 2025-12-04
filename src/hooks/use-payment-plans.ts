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

export type PaymentPlan = {
    id: string;
    student_id: string;
    plan_name: string;
    plan_type: 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'custom';
    start_date: string;
    end_date?: string | null;
    monthly_amount: number;
    total_amount?: number | null;
    discount_amount?: number | null;
    discount_percent?: number | null;
    is_active: boolean;
    created_at?: any;
};

export function usePaymentPlans(studentId?: string) {
    const [paymentPlans, setPaymentPlans] = useState<PaymentPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let q;
        if (studentId) {
            q = query(
                collection(db, 'payment_plans'),
                where('student_id', '==', studentId),
                where('is_active', '==', true),
                orderBy('start_date', 'desc')
            );
        } else {
            q = query(
                collection(db, 'payment_plans'),
                where('is_active', '==', true),
                orderBy('start_date', 'desc')
            );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const plansData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PaymentPlan[];
            setPaymentPlans(plansData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Ödeme planları alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [studentId]);

    const addPaymentPlan = async (planData: Omit<PaymentPlan, 'id' | 'is_active' | 'created_at'>) => {
        try {
            await addDoc(collection(db, 'payment_plans'), {
                ...planData,
                is_active: true,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add payment plan error:', err);
            throw new Error('Ödeme planı eklenirken bir hata oluştu.');
        }
    };

    const updatePaymentPlan = async (id: string, planData: Partial<PaymentPlan>) => {
        try {
            const planRef = doc(db, 'payment_plans', id);
            await updateDoc(planRef, planData);
        } catch (err: any) {
            console.error('Update payment plan error:', err);
            throw new Error('Ödeme planı güncellenirken bir hata oluştu.');
        }
    };

    const deletePaymentPlan = async (id: string) => {
        try {
            const planRef = doc(db, 'payment_plans', id);
            await updateDoc(planRef, { is_active: false });
        } catch (err: any) {
            console.error('Delete payment plan error:', err);
            throw new Error('Ödeme planı silinirken bir hata oluştu.');
        }
    };

    return {
        paymentPlans,
        loading,
        error,
        addPaymentPlan,
        updatePaymentPlan,
        deletePaymentPlan
    };
}
