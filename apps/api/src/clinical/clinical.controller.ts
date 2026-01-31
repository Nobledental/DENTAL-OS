import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { AnalyticsService } from './analytics.service';
import { ClinicalSpecialistService } from './clinical-specialist.service';

@Controller('clinical')
export class ClinicalController {
  constructor(
    private readonly clinicalService: ClinicalService,
    private readonly analyticsService: AnalyticsService,
    private readonly specialistService: ClinicalSpecialistService
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

  // --- Specialist Module (Phase 11) ---

  @Post('diagnosis/provisional')
  getProvisionalDiagnosis(@Body() body: { symptoms: string[] }) {
    return this.specialistService.getProvisionalDiagnosis(body.symptoms);
  }

  @Post('rct/save')
  saveRCT(@Body() body: any) {
    return this.specialistService.saveRCTData(
      body.dentalRecordId,
      body.toothNumber,
      body.data
    );
  }

  @Post('surgery/war-score')
  calculateWAR(@Body() body: any) {
    return this.specialistService.calculateWARScore(body);
  }

  @Post('ortho/cephalometric')
  saveCephalometric(@Body() body: any) {
    return this.specialistService.saveCephalometricData(body.dentalRecordId, body.data);
  }

  @Get('icd/search')
  searchICD(@Query('q') searchTerm: string) {
    return this.specialistService.searchICDCode(searchTerm);
  }

  @Post('assets/upload')
  uploadAsset(@Body() body: any) {
    return this.specialistService.uploadClinicalAsset(body);
  }

  @Get('assets/patient/:patientId')
  getAssets(@Param('patientId') patientId: string) {
    return this.specialistService.getPatientAssets(patientId);
  }

  @Post('medication/log')
  logMedication(@Body() body: any) {
    return this.specialistService.logMedication(body);
  }

  @Get('medication/history/:patientId')
  getMedicationHistory(@Param('patientId') patientId: string, @Query('days') days?: number) {
    return this.specialistService.getMedicationHistory(patientId, days ? parseInt(days.toString()) : 7);
  }
}
