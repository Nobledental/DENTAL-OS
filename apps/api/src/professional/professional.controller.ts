import { Controller, Post, Body, Get, Param, BadRequestException } from '@nestjs/common';
import { ProfessionalService } from './professional.service';

@Controller('professional')
export class ProfessionalController {
    constructor(private readonly professionalService: ProfessionalService) { }

    @Post('upgrade/:userId')
    async upgradeToDoctor(
        @Param('userId') userId: string,
        @Body('registrationNumber') registrationNumber: string,
    ) {
        return this.professionalService.upgradeToDoctor(userId, registrationNumber);
    }

    @Get('status/:userId')
    async getStatus(@Param('userId') userId: string) {
        return this.professionalService.getProfessionalStatus(userId);
    }
}
