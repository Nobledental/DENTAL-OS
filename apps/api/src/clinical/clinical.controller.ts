import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ClinicalService } from './clinical.service';
import { AnalyticsService } from './analytics.service';
import { ClinicalSpecialistService } from './clinical-specialist.service';
import { EndodonticService } from './endodontic.service';
import { OrthodonticService } from './orthodontic.service';
import { PeriodontalService } from './periodontal.service';

@Controller('clinical')
export class ClinicalController {
  constructor(
    private readonly clinicalService: ClinicalService,
    private readonly analyticsService: AnalyticsService,
    private readonly specialistService: ClinicalSpecialistService,
    private readonly endodonticService: EndodonticService,
    private readonly orthodonticService: OrthodonticService,
    private readonly periodontalService: PeriodontalService
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

  // **Phase 12: RCT Multi-Sitting Endpoint**
  @Post('rct/save')
  saveRCTData(@Body() body: { dentalRecordId?: string; patientId: string; metadata: any }) {
    return this.endodonticService.saveSittingData(body);
  }

  @Get('rct/history/:dentalRecordId')
  getRCTHistory(@Param('dentalRecordId') dentalRecordId: string) {
    return this.endodonticService.getSittingHistory(dentalRecordId);
  }

  // Existing endpoints
  @Post('diagnosis/provisional')
  getProvisionalDiagnosis(@Body() body: { symptoms: string[]; clinicalFindings: string[]; vitalSigns?: string[] }) {
    return this.specialistService.getProvisionalDiagnosis(body);
  }

  @Post('surgery/war-score')
  calculateWARScore(@Body() body: { angulation: string; depth: string; relationToRamus: string }) {
    return this.specialistService.calculateWARScore(body);
  }

  @Post('ortho/cephalometric')
  saveCephalometricData(@Body() body: { dentalRecordId: string; data: any }) {
    return this.specialistService.saveCephalometricData(body.dentalRecordId, body.data);
  }

  @Get('icd/search')
  searchICDCode(@Query('q') searchTerm: string) { // Changed from @Param to @Query to match original
    return this.specialistService.searchICDCode(searchTerm);
  }

  @Post('assets/upload')
  uploadAsset(@Body() body: any) {
    return this.specialistService.uploadClinicalAsset(body);
  }

  @Get('assets/patient/:patientId')
  getPatientAssets(@Param('patientId') patientId: string) {
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

  // --- Phase 13: Orthodontic Case Study & Cephalometric Engine ---

  @Post('orthodontic/save')
  saveOrthodonticAnalysis(@Body() body: { patientId: string; metadata: any }) {
    return this.orthodonticService.saveOrthodonticAnalysis(body);
  }

  @Get('orthodontic/history/:patientId')
  getOrthodonticHistory(@Param('patientId') patientId: string) {
    return this.orthodonticService.getOrthodonticHistory(patientId);
  }

  @Post('orthodontic/presentation/:clinicalNoteId')
  generateCasePresentation(@Param('clinicalNoteId') clinicalNoteId: string, @Body() body: { patientId: string }) {
    return this.orthodonticService.generateCasePresentation(body.patientId, clinicalNoteId);
  }

  // --- Phase 15: Periodontal Charting & Surgery Suite ---

  @Post('periodontal/save')
  savePeriodontalChart(@Body() body: { patientId: string; metadata: any }) {
    return this.periodontalService.savePeriodontalChart(body);
  }

  @Get('periodontal/history/:patientId')
  getPeriodontalHistory(@Param('patientId') patientId: string) {
    return this.periodontalService.getPeriodontalHistory(patientId);
  }

  @Get('periodontal/suture-reminders/:clinicId')
  getSutureReminders(@Param('clinicId') clinicId: string) {
    return this.periodontalService.getSutureReminders(clinicId);
  }
}

