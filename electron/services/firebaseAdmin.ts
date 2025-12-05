import * as admin from 'firebase-admin';
import { app } from 'electron';
import path from 'path';
import fs from 'fs';

let adminInitialized = false;

export function initializeFirebaseAdmin() {
    if (adminInitialized) {
        return admin;
    }

    try {
        // Service account key dosyasını ara
        const pathsToCheck = [
            process.resourcesPath ? path.join(process.resourcesPath, 'firebase-service-account.json') : '',
            path.join(app.getAppPath(), '..', 'firebase-service-account.json'),
            path.join(app.getAppPath(), 'firebase-service-account.json'),
            path.join(__dirname, '..', 'firebase-service-account.json'), // Production/Build
            path.join(process.cwd(), 'firebase-service-account.json'),   // Development
            path.join(__dirname, '..', '..', 'firebase-service-account.json') // Alternative build structure
        ].filter(Boolean);

        let serviceAccountPath = '';
        for (const p of pathsToCheck) {
            if (fs.existsSync(p)) {
                serviceAccountPath = p;
                break;
            }
        }

        if (serviceAccountPath) {
            try {
                const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount)
                });

                console.log('Firebase Admin SDK initialized with service account from:', serviceAccountPath);
            } catch (parseError) {
                console.error('Failed to parse service account:', parseError);
                throw parseError;
            }
        } else {
            // Service account yoksa, environment variables kullan
            const errorMsg = `Service account file not found. Checked paths: ${JSON.stringify(pathsToCheck, null, 2)}`;
            console.error(errorMsg);

            // Throw error explicitly to show in renderer
            throw new Error(errorMsg);
        }

        adminInitialized = true;
    } catch (error) {
        console.error('Failed to initialize Firebase Admin:', error);
        throw error;
    }

    return admin;
}

export async function deleteUserFromAuth(uid: string): Promise<void> {
    try {
        const adminInstance = initializeFirebaseAdmin();
        await adminInstance.auth().deleteUser(uid);
        console.log(`Successfully deleted user ${uid} from Firebase Auth`);
    } catch (error: any) {
        console.error('Error deleting user from Auth:', error);
        throw new Error(`Auth silme hatası: ${error.message}`);
    }
}

export async function deleteUserFromFirestore(uid: string): Promise<void> {
    try {
        const adminInstance = initializeFirebaseAdmin();
        await adminInstance.firestore().collection('users').doc(uid).delete();
        console.log(`Successfully deleted user ${uid} from Firestore`);
    } catch (error: any) {
        console.error('Error deleting user from Firestore:', error);
        throw new Error(`Firestore silme hatası: ${error.message}`);
    }
}

export async function deleteUserCompletely(uid: string): Promise<void> {
    // First delete from Firestore, then from Auth
    // This order ensures we don't lose the ability to track the user
    await deleteUserFromFirestore(uid);
    await deleteUserFromAuth(uid);
}

export async function createUser(userData: { email: string; password: string; username: string; role: string }): Promise<string> {
    try {
        const adminInstance = initializeFirebaseAdmin();

        // 1. Create user in Firebase Auth
        const userRecord = await adminInstance.auth().createUser({
            email: userData.email,
            password: userData.password,
            displayName: userData.username
        });

        // 2. Create user document in Firestore
        await adminInstance.firestore().collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: userData.email,
            username: userData.username,
            role: userData.role,
            created_at: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Successfully created user ${userRecord.uid}`);
        return userRecord.uid;
    } catch (error: any) {
        console.error('Error creating user:', error);
        throw new Error(`Kullanıcı oluşturma hatası: ${error.message}`);
    }
}

export { admin };
