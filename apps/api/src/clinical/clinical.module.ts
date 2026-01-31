import { Module } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { ClinicalController } from './clinical.controller';
import { AnalyticsService } from './analytics.service';
import { ClinicalSpecialistService } from './clinical-specialist.service';

@Module({
    controllers: [ClinicalController],
    providers: [ClinicalService, AnalyticsService, ClinicalSpecialistService],
    exports: [ClinicalService, AnalyticsService, ClinicalSpecialistService],
})
export class ClinicalModule { }
