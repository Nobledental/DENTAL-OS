import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface ScheduleNotificationDto {
    patientId: string;
    message: string;
    delayHours: number;
    type: string;
    metadata?: any;
}

@Injectable()
export class NotificationService {
    constructor(private prisma: PrismaService) { }

    async scheduleNotification(data: ScheduleNotificationDto) {
        const scheduledAt = new Date();
        scheduledAt.setHours(scheduledAt.getHours() + data.delayHours);

        const notification = await this.prisma.scheduledNotification.create({
            data: {
                patient_id: data.patientId,
                message: data.message,
                scheduled_at: scheduledAt,
                status: 'PENDING',
                metadata: {
                    type: data.type,
                    ...data.metadata
                } as any
            }
        });

        return {
            success: true,
            notificationId: notification.id,
            scheduledAt: notification.scheduled_at,
            message: `Notification scheduled for ${scheduledAt.toLocaleString()}`
        };
    }

    async getPendingNotifications() {
        const now = new Date();

        return await this.prisma.scheduledNotification.findMany({
            where: {
                status: 'PENDING',
                scheduled_at: {
                    lte: now
                }
            },
            orderBy: {
                scheduled_at: 'asc'
            }
        });
    }

    async markAsSent(notificationId: string) {
        return await this.prisma.scheduledNotification.update({
            where: { id: notificationId },
            data: {
                status: 'SENT',
                sent_at: new Date()
            }
        });
    }

    // Cron job would call this method periodically
    async processPendingNotifications() {
        const pending = await this.getPendingNotifications();
        const results = [];

        for (const notification of pending) {
            try {
                // TODO: Integrate with actual notification service (Twilio, Firebase, etc.)
                // For now, just mark as sent
                console.log(`Sending notification to patient ${notification.patient_id}: ${notification.message}`);

                await this.markAsSent(notification.id);
                results.push({
                    id: notification.id,
                    status: 'SENT'
                });
            } catch (error) {
                console.error(`Failed to send notification ${notification.id}:`, error);
                await this.prisma.scheduledNotification.update({
                    where: { id: notification.id },
                    data: { status: 'FAILED' }
                });
                results.push({
                    id: notification.id,
                    status: 'FAILED'
                });
            }
        }

        return results;
    }
}
