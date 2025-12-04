import { ipcMain } from 'electron';
import { deleteUserCompletely } from '../services/firebaseAdmin';

export function registerUsersIpc() {
    // Delete user completely (Auth + Firestore)
    ipcMain.handle('users:delete-complete', async (event, uid: string) => {
        try {
            await deleteUserCompletely(uid);
            return { success: true };
        } catch (error: any) {
            console.error('Error in users:delete-complete:', error);
            throw new Error(error.message || 'Kullanıcı silinemedi');
        }
    });

    // Create user securely (Auth + Firestore)
    ipcMain.handle('users:create', async (event, userData: any) => {
        try {
            const { createUser } = await import('../services/firebaseAdmin');
            const uid = await createUser(userData);
            return { success: true, uid };
        } catch (error: any) {
            console.error('Error in users:create:', error);
            throw new Error(error.message || 'Kullanıcı oluşturulamadı');
        }
    });
}
