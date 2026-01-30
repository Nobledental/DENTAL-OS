import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';

@Controller('appointments')
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) { }

    @Post('check-in')
    async checkIn(@Body() body: { patientId: string; clinicId: string; isEmergency?: boolean }) {
        return this.appointmentService.checkIn(body.patientId, body.clinicId, body.isEmergency);
    }

    @Get('queue/:clinicId')
    async getQueue(@Param('clinicId') clinicId: string) {
        return this.appointmentService.getActiveQueue(clinicId);
    }
}
