import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { AnalyticsService } from './analytics.service';

@Controller('clinical')
export class ClinicalController {
  constructor(
    private readonly clinicalService: ClinicalService,
    private readonly analyticsService: AnalyticsService
  ) { }

  @Get('analytics/:clinicId')
  getAnalytics(@Param('clinicId') clinicId: string) {
    return this.analyticsService.getVelocityMetrics(clinicId);
  }

  @Get('heatmap/:clinicId')
  getHeatmap(@Param('clinicId') clinicId: string) {
    return this.analyticsService.getCongestionHeatmap(clinicId);
  }

  @Post()
  create(@Body() createDto: any) {
    return this.clinicalService.createRecord(createDto);
  }

  @Get('patient/:patientId')
  findByPatient(@Param('patientId') patientId: string) {
    return this.clinicalService.findRecords(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clinicalService.findRecord(id);
  }

  // --- Dental Charting (Phase 8) ---

  @Post('dental-record/:patientId')
  saveDentalRecord(@Param('patientId') patientId: string, @Body() chartingData: any) {
    return this.clinicalService.saveDentalRecord(patientId, chartingData);
  }

  @Get('dental-record/:patientId')
  getDentalRecord(@Param('patientId') patientId: string) {
    return this.clinicalService.getDentalRecord(patientId);
  }

  @Get('dental-record/:patientId/history')
  getDentalRecordHistory(@Param('patientId') patientId: string) {
    return this.clinicalService.getDentalRecordHistory(patientId);
  }
}
