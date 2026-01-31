import { Module } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { ClinicalController } from './clinical.controller';
import { AnalyticsService } from './analytics.service';

@Module({
    controllers: [ClinicalController],
    providers: [ClinicalService, AnalyticsService],
    exports: [ClinicalService, AnalyticsService],
})
export class ClinicalModule { }
