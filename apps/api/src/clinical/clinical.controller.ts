import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ClinicalService } from './clinical.service';

@Controller('clinical')
export class ClinicalController {
  constructor(private readonly clinicalService: ClinicalService) {}

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
}
