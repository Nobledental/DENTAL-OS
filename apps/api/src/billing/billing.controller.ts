import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';

@Controller('billing')
export class BillingController {
    constructor(private readonly billingService: BillingService) { }

    @Get('tariffs')
    async getTariffs(@Query('clinicId') clinicId: string) {
        return this.billingService.getTariffs(clinicId);
    }

    @Post('invoice')
    async createInvoice(@Body() createInvoiceDto: any) {
        return this.billingService.createInvoice(createInvoiceDto);
    }
}
