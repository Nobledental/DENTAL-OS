import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BillingService {
    constructor(private prisma: PrismaService) { }

    async getTariffs(clinicId: string) {
        return this.prisma.tariffMaster.findMany({
            where: { clinic_id: clinicId },
            include: { bundle: { include: { items: true } } },
        });
    }

    async createInvoice(data: any) {
        const { patientId, clinicId, items, paymentStatus } = data;

        return this.prisma.$transaction(async (tx) => {
            // 1. Create Invoice
            const invoiceCount = await tx.invoice.count({ where: { clinic_id: clinicId } });
            const invoiceNo = `INV-${new Date().getFullYear()}-${(invoiceCount + 1).toString().padStart(3, '0')}`;

            const subtotal = items.reduce((acc, item) => acc + (item.baseCost * item.quantity), 0);
            const gstTotal = items.reduce((acc, item) => acc + (item.baseCost * item.quantity * (item.taxRate / 100)), 0);
            const total = subtotal + gstTotal;

            const invoice = await tx.invoice.create({
                data: {
                    invoice_no: invoiceNo,
                    patient_id: patientId,
                    clinic_id: clinicId,
                    subtotal,
                    gst_total: gstTotal,
                    total,
                    status: 'FINALIZED',
                    items: {
                        create: items.map((item: any) => ({
                            name: item.name,
                            quantity: item.quantity,
                            unit_price: item.baseCost,
                            tax_rate: item.taxRate,
                            tax_amount: item.baseCost * item.quantity * (item.taxRate / 100),
                            tariff_id: item.id,
                        })),
                    },
                },
            });

            // 2. Handle Inventory Deduction (Bundles)
            for (const item of items) {
                const bundle = await tx.bundle.findUnique({
                    where: { tariff_id: item.id },
                    include: { items: true },
                });

                if (bundle) {
                    for (const bundleItem of bundle.items) {
                        await tx.inventory.update({
                            where: { id: bundleItem.inventory_id },
                            data: {
                                stock_quantity: {
                                    decrement: bundleItem.quantity_needed * item.quantity,
                                },
                            },
                        });
                    }
                }
            }

            // 3. Create Billing Link if needed (Mock for now as we don't have appointment here)
            // In real scenario, we link to appointment_id passed in data

            return invoice;
        });
    }
}
