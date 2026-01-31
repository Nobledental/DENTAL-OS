import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface InventoryDeductionDto {
    items: Array<{
        itemName: string;
        quantity: number;
        size?: string;
        unit?: string;
    }>;
    reason: string;
    patientId: string;
    toothNumber?: number;
    clinicalNoteId?: string;
}

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    async deductItems(data: InventoryDeductionDto) {
        const transactions = [];

        for (const item of data.items) {
            // Create inventory transaction record
            const transaction = await this.prisma.inventoryTransaction.create({
                data: {
                    clinic_id: 'default-clinic-id', // Replace with actual from auth context
                    item_name: item.itemName,
                    quantity: item.quantity,
                    type: 'DEDUCTION',
                    reason: data.reason,
                    patient_id: data.patientId,
                    metadata: {
                        toothNumber: data.toothNumber,
                        clinicalNoteId: data.clinicalNoteId,
                        size: item.size
                    } as any
                }
            });

            transactions.push(transaction);

            // Update inventory stock (if InventoryItem exists)
            try {
                await this.prisma.inventoryItem.updateMany({
                    where: {
                        item_name: item.itemName,
                        size: item.size || null
                    },
                    data: {
                        quantity: {
                            decrement: item.quantity
                        }
                    }
                });
            } catch (error) {
                console.error(`Inventory item ${item.itemName} not found, transaction logged only`);
            }
        }

        return {
            success: true,
            transactions,
            message: `Deducted ${data.items.length} items from inventory`
        };
    }

    async getInventoryHistory(patientId: string) {
        return await this.prisma.inventoryTransaction.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: 'desc' },
            take: 50
        });
    }
}
