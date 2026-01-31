import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseAdminService } from '../notifications/firebase-admin.service';

@Injectable()
export class SettlementService {
    constructor(
        private prisma: PrismaService,
        private firebaseAdmin: FirebaseAdminService,
    ) { }

    async getDailyTransactions(clinicId: string, date: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        return this.prisma.billing.findMany({
            where: {
                appointment: { clinic_id: clinicId },
                created_at: { gte: startOfDay, lte: endOfDay },
            },
            include: {
                appointment: { include: { patient: true } },
                invoice: { include: { items: true } },
            },
        });
    }

    async verifyTransaction(billingId: string) {
        return (this.prisma as any).billing.update({
            where: { id: billingId },
            data: { is_verified: true },
        });
    }

    async closeDay(clinicId: string, date: string, userId: string) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        // Check if already closed
        const existing = await (this.prisma as any).daySettlement.findUnique({
            where: { clinic_id_date: { clinic_id: clinicId, date: startOfDay } }
        });

        if (existing && existing.status === 'CLOSED') {
            throw new BadRequestException('Day already closed for this clinic and date');
        }

        const billings = await this.prisma.billing.findMany({
            where: {
                appointment: { clinic_id: clinicId },
                created_at: { gte: startOfDay, lte: endOfDay },
            },
            include: { invoice: { include: { items: true } } }
        });

        let totalCash = 0;
        let totalUpi = 0;
        let totalCard = 0;
        let procedureCount = 0;
        const patientIds = new Set();

        billings.forEach(b => {
            const amount = Number(b.total_amount);
            const mode = (b as any).payment_mode;
            if (mode === 'CASH') totalCash += amount;
            else if (mode === 'UPI') totalUpi += amount;
            else if (mode === 'CARD') totalCard += amount;

            patientIds.add(b.appointment_id); // Simplified patient count
            if (b.invoice) {
                procedureCount += b.invoice.items.length;
            }
        });

        const appts = await this.prisma.appointment.findMany({
            where: {
                clinic_id: clinicId,
                created_at: { gte: startOfDay, lte: endOfDay },
            }
        });

        const newPatients = appts.filter(a => a.visit_type === 'CONSULTATION').length;
        const followUps = appts.filter(a => a.visit_type !== 'CONSULTATION').length;

        // Stock Alerts
        const inventory = await this.prisma.inventory.findMany({
            where: { clinic_id: clinicId }
        });
        const stockAlerts = inventory.filter(i => i.stock_quantity <= i.min_stock_level).map(i => i.name);

        const totalRevenue = totalCash + totalUpi + totalCard;

        const settlement = await (this.prisma as any).daySettlement.upsert({
            where: { clinic_id_date: { clinic_id: clinicId, date: startOfDay } },
            update: {
                total_cash: totalCash,
                total_upi: totalUpi,
                total_card: totalCard,
                total_revenue: totalRevenue,
                patient_count: patientIds.size,
                procedure_count: procedureCount,
                status: 'CLOSED',
                closed_at: new Date(),
                closed_by_id: userId,
                summary_json: {
                    cash: totalCash,
                    upi: totalUpi,
                    card: totalCard,
                    patients: {
                        total: patientIds.size,
                        new: newPatients,
                        follow_up: followUps
                    },
                    procedures: procedureCount,
                    stock_alerts: stockAlerts
                }
            },
            create: {
                clinic_id: clinicId,
                date: startOfDay,
                total_cash: totalCash,
                total_upi: totalUpi,
                total_card: totalCard,
                total_revenue: totalRevenue,
                patient_count: patientIds.size,
                procedure_count: procedureCount,
                status: 'CLOSED',
                closed_at: new Date(),
                closed_by_id: userId,
                summary_json: {
                    cash: totalCash,
                    upi: totalUpi,
                    card: totalCard,
                    patients: {
                        total: patientIds.size,
                        new: newPatients,
                        follow_up: followUps
                    },
                    procedures: procedureCount,
                    stock_alerts: stockAlerts
                }
            }
        });

        // Trigger Firebase Notification to OWNER
        await this.firebaseAdmin.sendToStaff('OWNER', 'Day Closed - Noble Dental',
            `Total: ₹${totalRevenue}. UPI: ₹${totalUpi}, Cash: ₹${totalCash}. Patients: ${patientIds.size} (${newPatients} New). Alerts: ${stockAlerts.length}`
        );

        return settlement;
    }

    async unlockDay(clinicId: string, date: string, reason: string, userId: string) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);

        const settlement = await (this.prisma as any).daySettlement.findUnique({
            where: { clinic_id_date: { clinic_id: clinicId, date: d } }
        });

        if (!settlement) throw new BadRequestException('No settlement found to unlock');

        const history = (settlement.unlock_history as any[]) || [];
        history.push({ reason, unlocked_at: new Date(), unlocked_by: userId });

        return (this.prisma as any).daySettlement.update({
            where: { id: settlement.id },
            data: {
                status: 'OPEN',
                unlock_history: history
            },
        });
    }

    async getSettlement(clinicId: string, date: string) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        return (this.prisma as any).daySettlement.findUnique({
            where: { clinic_id_date: { clinic_id: clinicId, date: d } }
        });
    }
}
