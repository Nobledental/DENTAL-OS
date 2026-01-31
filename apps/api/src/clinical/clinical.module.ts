import { Module } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { ClinicalController } from './clinical.controller';
import { AnalyticsService } from './analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClinicalSpecialistService } from './clinical-specialist.service';
import { EndodonticService } from './endodontic.service';
import { OrthodonticService } from './orthodontic.service';
import { PeriodontalService } from './periodontal.service';

@Module({
    controllers: [ClinicalController],
    providers: [ClinicalService, AnalyticsService, ClinicalSpecialistService, EndodonticService, OrthodonticService, PeriodontalService, PrismaService],
    exports: [ClinicalService, AnalyticsService, ClinicalSpecialistService, EndodonticService, OrthodonticService, PeriodontalService],
})
export class ClinicalModule { }

