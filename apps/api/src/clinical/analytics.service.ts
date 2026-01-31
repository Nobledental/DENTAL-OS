import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getVelocityMetrics(clinicId: string) {
        const appointments = await this.prisma.appointment.findMany({
            where: {
                clinic_id: clinicId,
                status: 'COMPLETED',
                status_timestamps: { not: null }
            },
            include: { billing: true }
        });

        let totalWaitTime = 0;
        let totalBillingVelocity = 0;
        let validWaitCounts = 0;
        let validBillingCounts = 0;

        appointments.forEach(appt => {
            const ts = appt.status_timestamps as any;

            // 1. Wait Time: Waiting -> In Chair
            if (ts.waiting_at && ts.in_chair_at) {
                const wait = (new Date(ts.in_chair_at).getTime() - new Date(ts.waiting_at).getTime()) / 60000;
                if (wait > 0) {
                    totalWaitTime += wait;
                    validWaitCounts++;
                }
            }

            // 2. Billing Velocity: Completed -> Paid
            if (ts.completed_at && appt.billing?.payment_status === 'PAID' && appt.billing?.updated_at) {
                const billTime = (new Date(appt.billing.updated_at).getTime() - new Date(ts.completed_at).getTime()) / 60000;
                if (billTime > 0) {
                    totalBillingVelocity += billTime;
                    validBillingCounts++;
                }
            }
        });

        return {
            avgWaitTime: validWaitCounts > 0 ? Math.round(totalWaitTime / validWaitCounts) : 0,
            avgBillingVelocity: validBillingCounts > 0 ? Math.round(totalBillingVelocity / validBillingCounts) : 0,
            turnoverRate: appointments.length > 0 ? "4.2 patients/hr" : "0", // Mock for turnover calc logic
            validSamples: appointments.length
        };
    }

    async getCongestionHeatmap(clinicId: string) {
        const appointments = await this.prisma.appointment.findMany({
            where: {
                clinic_id: clinicId,
                created_at: {
                    gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                }
            },
            select: { start_time: true }
        });

        const hourlyCounts = new Array(24).fill(0);
        appointments.forEach(appt => {
            const hour = new Date(appt.start_time).getHours();
            hourlyCounts[hour]++;
        });

        return hourlyCounts;
    }
}
