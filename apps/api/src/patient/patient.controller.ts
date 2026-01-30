import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PatientService } from './patient.service';

@Controller('patients')
export class PatientController {
  constructor(private readonly patientService: PatientService) { }

  @Post()
  create(@Body() createPatientDto: any) {
    return this.patientService.create(createPatientDto);
  }

  @Get('search')
  search(@Query('q') query: string) {
    return this.patientService.search(query);
  }

  @Post(':id/audit')
  logAudit(@Param('id') id: string, @Body() body: { performerId: string, field: string }) {
    return this.patientService.logPIIAccess(id, body.performerId, body.field);
  }

  @Get()
  findAll(@Query('clinicId') clinicId: string) {
    return this.patientService.findAll(clinicId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePatientDto: any) {
    return this.patientService.update(id, updatePatientDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.patientService.remove(id);
  }
}
