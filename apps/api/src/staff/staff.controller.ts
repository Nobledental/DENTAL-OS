import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { StaffService } from './staff.service';

@Controller('staff')
export class StaffController {
    constructor(private readonly staffService: StaffService) { }

    @Get()
    async getStaff(@Query('clinicId') clinicId: string) {
        return this.staffService.getStaff(clinicId);
    }

    @Post(':userId/permissions')
    async updatePermissions(
        @Param('userId') userId: string,
        @Body() permissions: any,
    ) {
        return this.staffService.updatePermissions(userId, permissions);
    }
}
