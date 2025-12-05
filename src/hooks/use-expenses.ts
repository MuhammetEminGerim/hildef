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

export type Expense = {
    id: string;
    category: string;
    amount: number;
    expense_date: string;
    description?: string;
    notes?: string;
    created_at?: any;
};

export function useExpenses() {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'expenses'),
            orderBy('expense_date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const expensesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Expense[];

            // Client-side filter for soft delete
            const activeExpenses = expensesData.filter((expense: any) => expense.is_active !== false);

            setExpenses(activeExpenses);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Gider listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
        try {
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(expenseData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await addDoc(collection(db, 'expenses'), {
                ...sanitizedData,
                is_active: true, // Mark as active
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add expense error:', err);
            throw new Error('Gider eklenirken bir hata oluştu.');
        }
    };

    const updateExpense = async (id: string, expenseData: Partial<Expense>) => {
        try {
            const expenseRef = doc(db, 'expenses', id);
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(expenseData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(expenseRef, sanitizedData);
        } catch (err: any) {
            console.error('Update expense error:', err);
            throw new Error('Gider güncellenirken bir hata oluştu.');
        }
    };

    const deleteExpense = async (id: string) => {
        try {
            const expenseRef = doc(db, 'expenses', id);
            // Soft delete instead of hard delete
            await updateDoc(expenseRef, { is_active: false });
        } catch (err: any) {
            console.error('Delete expense error:', err);
            throw new Error('Gider silinirken bir hata oluştu.');
        }
    };

    return {
        expenses,
        loading,
        error,
        addExpense,
        updateExpense,
        deleteExpense
    };
}
