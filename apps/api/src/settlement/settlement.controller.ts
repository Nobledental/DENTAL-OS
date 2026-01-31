import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { SettlementService } from './settlement.service';

@Controller('settlement')
export class SettlementController {
    constructor(private readonly settlementService: SettlementService) { }

    @Get('transactions/:clinicId')
    getDailyTransactions(@Param('clinicId') clinicId: string, @Query('date') date: string) {
        return this.settlementService.getDailyTransactions(clinicId, date);
    }

    @Post('verify/:billingId')
    verifyTransaction(@Param('billingId') billingId: string) {
        return this.settlementService.verifyTransaction(billingId);
    }

    @Post('close/:clinicId')
    closeDay(
        @Param('clinicId') clinicId: string,
        @Body() body: { date: string, userId: string }
    ) {
        return this.settlementService.closeDay(clinicId, body.date, body.userId);
    }

    @Get('status/:clinicId')
    getSettlementStatus(@Param('clinicId') clinicId: string, @Query('date') date: string) {
        return this.settlementService.getSettlement(clinicId, date);
    }
}
