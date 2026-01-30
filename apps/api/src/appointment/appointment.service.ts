import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseAdminService } from '../notifications/firebase-admin.service';

@Injectable()
export class AppointmentService {
    constructor(
        private prisma: PrismaService,
        private firebaseAdmin: FirebaseAdminService,
    ) { }

    async checkIn(patientId: string, clinicId: string, isEmergency: boolean = false) {
        // 1. Get today's range
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        let nextQueueNo = 1;

        if (isEmergency) {
            // Emergency moves to #1, push everyone else back
            await this.prisma.appointment.updateMany({
                where: {
                    clinic_id: clinicId,
                    status: 'WAITING',
                    created_at: { gte: today, lt: tomorrow },
                },
                data: {
                    queue_number: { increment: 1 },
                },
            });
            nextQueueNo = 1;
        } else {
            // Normal check-in gets next available slot
            const lastAppt = await this.prisma.appointment.findFirst({
                where: {
                    clinic_id: clinicId,
                    created_at: { gte: today, lt: tomorrow },
                },
                orderBy: { queue_number: 'desc' },
                select: { queue_number: true },
            });
            nextQueueNo = (lastAppt?.queue_number || 0) + 1;
        }

        // 2. Find or Create appointment
        const existingAppt = await this.prisma.appointment.findFirst({
            where: {
                patient_id: patientId,
                clinic_id: clinicId,
                status: 'SCHEDULED',
                start_time: { gte: today, lt: tomorrow },
            },
        });

        const data = {
            status: 'WAITING',
            queue_number: nextQueueNo,
            estimated_wait_mins: nextQueueNo * 15,
            is_emergency: isEmergency,
        } as any;

        const clinicDoctor = await this.prisma.user.findFirst({
            where: { clinic_id: clinicId, role: 'DOCTOR' }
        });

        const result = await (existingAppt ? this.prisma.appointment.update({
            where: { id: existingAppt.id },
            data,
            include: { patient: { include: { user: true } } }
        }) : this.prisma.appointment.create({
            data: {
                patient_id: patientId,
                clinic_id: clinicId,
                doctor_id: clinicDoctor?.id || 'GLOBAL_PENDING', // Fallback
                ...data,
                start_time: new Date(),
                end_time: new Date(Date.now() + 30 * 60000),
            },
            include: { patient: { include: { user: true } } }
        }));

        // Trigger Zero-Cost Notification
        if (result.patient?.user?.fcm_token) {
            this.firebaseAdmin.sendPushNotification(
                result.patient.user.fcm_token,
                "Checked In! 🦷",
                `You are #${result.queue_number} in line. Est. wait: ${result.estimated_wait_mins} mins.`
            );
        }

        return result;
    }

    async getActiveQueue(clinicId: string) {
        return this.prisma.appointment.findMany({
            where: {
                clinic_id: clinicId,
                status: { in: ['WAITING', 'IN_CHAIR'] },
            },
            include: {
                patient: { include: { user: { select: { full_name: true } } } },
            },
            orderBy: { queue_number: 'asc' },
        });
    }
}
