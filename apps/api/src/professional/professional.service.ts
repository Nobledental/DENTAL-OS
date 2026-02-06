import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, Role } from '@prisma/client';

@Injectable()
export class ProfessionalService {
    constructor(private prisma: PrismaService) { }

    async upgradeToDoctor(userId: string, registrationNumber: string) {
        // 1. Verify PRN (In a real app, this would call an external Council API)
        if (!registrationNumber || registrationNumber.length < 5) {
            throw new BadRequestException('Invalid Permanent Registration Number format');
        }

        // 2. Update User Status
        const updatedUser = await this.prisma.user.update({
            where: { id: userId },
            data: {
                registration_status: RegistrationStatus.PERMANENT,
                registration_number: registrationNumber,
                role: Role.DOCTOR, // Self-evolution from STUDENT to DOCTOR
            },
        });

        // 3. Update StaffData if it exists
        await this.prisma.staffData.updateMany({
            where: { user_id: userId },
            data: {
                registration_status: RegistrationStatus.PERMANENT,
                registration_number: registrationNumber,
            },
        });

        // NOTE: Hand-Skill scores and Cases are already linked via userId in their respective models.
        // Data integrity is preserved as the ID remains constant.

        return {
            success: true,
            status: updatedUser.registration_status,
            role: updatedUser.role,
            message: 'Professional status upgraded to Permanent (DOCTOR). Clinic Mode unlocked.'
        };
    }

    async getProfessionalStatus(userId: string) {
        return this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                registration_status: true,
                registration_number: true,
                current_year: true,
                role: true,
            },
        });
    }
}
