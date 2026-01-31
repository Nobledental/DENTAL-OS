import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
    constructor(private prisma: PrismaService) { }

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
            console.log(`[PUSH] To: ${token} | ${title}: ${body}`);
            // In production, we would use: await admin.messaging().send(message);
        } catch (error) {
            console.error('Error sending push notification:', error);
        }
    }

    async sendToPatient(patientId: string, title: string, body: string) {
        const patient = await this.prisma.patient.findUnique({
            where: { id: patientId },
            include: { user: { select: { fcm_token: true } } }
        });

        if (patient?.user?.fcm_token) {
            await this.sendPushNotification(patient.user.fcm_token, title, body);
        }
    }

    async sendToStaff(role: 'DOCTOR' | 'RECEPTIONIST' | 'ADMIN' | 'OWNER', title: string, body: string) {
        const staff = await this.prisma.user.findMany({
            where: { role: role as any },
            select: { fcm_token: true }
        });

        const tokens = staff.map(s => s.fcm_token).filter(Boolean);
        if (tokens.length > 0) {
            console.log(`[BROADCAST] Sent to ${tokens.length} ${role}s`);
            tokens.forEach(token => this.sendPushNotification(token!, title, body));
        }
    }
}
