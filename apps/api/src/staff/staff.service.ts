import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
    constructor(private prisma: PrismaService) { }

    async getStaff(clinicId: string) {
        return this.prisma.user.findMany({
            where: { clinic_id: clinicId },
            select: {
                id: true,
                full_name: true,
                role: true,
                permissions: true,
                phone: true,
            },
        });
    }

    async updatePermissions(userId: string, permissions: any) {
        return this.prisma.user.update({
            where: { id: userId },
            data: { permissions },
        });
    }
}
