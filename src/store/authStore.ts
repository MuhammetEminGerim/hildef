import { create } from 'zustand';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export type SessionUser = {
  id: string;
  uid: string; // Firebase UID
  username: string;
  email: string;
  role: 'admin' | 'staff';
};

type State = {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => () => void; // Returns unsubscribe function
};

export const useAuthStore = create<State>((set) => ({
  user: null,
  loading: true,
  error: null,
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // User state is handled by the listener
    } catch (e: any) {
      let message = 'Giriş başarısız';
      if (e.code === 'auth/invalid-email') message = 'Geçersiz e-posta adresi';
      if (e.code === 'auth/user-not-found') message = 'Kullanıcı bulunamadı';
      if (e.code === 'auth/wrong-password') message = 'Hatalı şifre';
      if (e.code === 'auth/invalid-credential') message = 'Hatalı e-posta veya şifre';

      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
  logout: async () => {
    set({ loading: true, error: null });
    try {
      await signOut(auth);
      set({ user: null, loading: false });
    } catch (e: any) {
      set({ error: e.message ?? 'Çıkış başarısız', loading: false });
    }
  },
  initialize: () => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            set({
              user: {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                username: userData.username || firebaseUser.email?.split('@')[0] || 'User',
                email: firebaseUser.email || '',
                role: userData.role || 'admin', // Default to admin if not set
              },
              loading: false,
            });
          } else {
            // User not in Firestore, create default admin user
            await setDoc(doc(db, 'users', firebaseUser.uid), {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.email?.split('@')[0] || 'Admin',
              role: 'admin',
              created_at: serverTimestamp()
            });

            set({
              user: {
                id: firebaseUser.uid,
                uid: firebaseUser.uid,
                username: firebaseUser.email?.split('@')[0] || 'Admin',
                email: firebaseUser.email || '',
                role: 'admin',
              },
              loading: false,
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic user data
          set({
            user: {
              id: firebaseUser.uid,
              uid: firebaseUser.uid,
              username: firebaseUser.email?.split('@')[0] || 'User',
              email: firebaseUser.email || '',
              role: 'admin',
            },
            loading: false,
          });
        }
      } else {
        set({ user: null, loading: false });
      }
    });
    return unsubscribe;
  },
}));


