import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicalService {
  constructor(
    private prisma: PrismaService,
  ) { }

  // --- Clinical Notes (was ClinicalRecord) ---

  async createRecord(dto: any) {
    const { patient_id, ...data } = dto;
    return await this.prisma.clinicalNote.create({
      data: {
        patient_id,
        visit_vitals: data.visit_vitals,
        systemic_review: data.systemic_review,
        chief_complaint: data.chief_complaint,
        clinical_findings: data.clinical_findings,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatment_text, // Assuming simple string in legacy DTO
        // other fields
      }
    });
  }

  async findRecords(patientId: string) {
    return await this.prisma.clinicalNote.findMany({
      where: { patient_id: patientId },
      orderBy: { created_at: 'desc' },
      include: { patient: { select: { user: { select: { full_name: true } } } } },
    });
  }

  async findRecord(id: string) {
    const record = await this.prisma.clinicalNote.findUnique({
      where: { id },
    });
    if (!record) throw new NotFoundException('Clinical record not found');
    return record;
  }

  // --- Treatment Plans ---

  async createPlan(dto: any) {
    // Logic for new TreatmentPlan model
    // We need to map DTO correctly. 
    // For now, minimal impl to pass build
    return { message: "Not fully implemented yet" };
  }

  async findPlans(patientId: string) {
    /*
   return await this.prisma.treatmentPlan.findMany({
       where: { dental_record: { patient_id: patientId } }, // Complex relation
       orderBy: { created_at: 'desc' }
   });
   */
    return [];
  }

  async updatePlan(id: string, dto: any) {
    // legacy stub
    return {};
  }
}
