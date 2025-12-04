import { useState, useEffect } from 'react';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export type Event = {
    id: string;
    name: string;
    event_date: string;
    event_time?: string;
    location?: string;
    description?: string;
    created_at?: any;
};

export function useEvents() {
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const q = query(
            collection(db, 'events'),
            orderBy('event_date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const eventsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Event[];
            setEvents(eventsData);
            setLoading(false);
        }, (err) => {
            console.error('Firestore error:', err);
            setError('Etkinlik listesi alınamadı.');
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const addEvent = async (eventData: Omit<Event, 'id' | 'created_at'>) => {
        try {
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(eventData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await addDoc(collection(db, 'events'), {
                ...sanitizedData,
                created_at: serverTimestamp()
            });
        } catch (err: any) {
            console.error('Add event error:', err);
            throw new Error('Etkinlik eklenirken bir hata oluştu.');
        }
    };

    const updateEvent = async (id: string, eventData: Partial<Event>) => {
        try {
            const eventRef = doc(db, 'events', id);
            // Sanitize data to remove undefined values
            const sanitizedData = Object.entries(eventData).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            await updateDoc(eventRef, sanitizedData);
        } catch (err: any) {
            console.error('Update event error:', err);
            throw new Error('Etkinlik güncellenirken bir hata oluştu.');
        }
    };

    const deleteEvent = async (id: string) => {
        try {
            const eventRef = doc(db, 'events', id);
            await deleteDoc(eventRef);
        } catch (err: any) {
            console.error('Delete event error:', err);
            throw new Error('Etkinlik silinirken bir hata oluştu.');
        }
    };

    return {
        events,
        loading,
        error,
        addEvent,
        updateEvent,
        deleteEvent
    };
}
