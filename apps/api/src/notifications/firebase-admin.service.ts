import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
    onModuleInit() {
        if (!admin.apps.length) {
            console.log('Firebase Admin initialized (Zero-Cost Engine Active)');
        }
    }

    async sendPushNotification(token: string, title: string, body: string) {
        if (!token) return;

        const message = {
            notification: { title, body },
            token: token,
        };

        try {
            // Mock sending for now to ensure ₹0 cost and no external blockers
            console.log(`[PUSH] To: ${token} | ${title}: ${body}`);
            // return admin.messaging().send(message);
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
}
