import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClinicalSpecialistService {
    constructor(private prisma: PrismaService) { }

    // AI Provisional Diagnosis Suggestor (Oral Medicine)
    async getProvisionalDiagnosis(symptoms: string[]) {
        const diagnosisMap: Record<string, { diagnosis: string; icd_code: string; confidence: number }[]> = {
            'radiating_pain': [
                { diagnosis: 'Acute Pulpitis', icd_code: 'K04.0', confidence: 0.85 },
                { diagnosis: 'Periapical Abscess', icd_code: 'K04.7', confidence: 0.70 }
            ],
            'thermal_sensitivity': [
                { diagnosis: 'Reversible Pulpitis', icd_code: 'K04.00', confidence: 0.80 },
                { diagnosis: 'Dentin Hypersensitivity', icd_code: 'K03.8', confidence: 0.65 }
            ],
            'swelling': [
                { diagnosis: 'Periapical Abscess', icd_code: 'K04.7', confidence: 0.90 },
                { diagnosis: 'Periodontal Abscess', icd_code: 'K05.21', confidence: 0.75 }
            ],
            'bleeding_gums': [
                { diagnosis: 'Gingivitis', icd_code: 'K05.10', confidence: 0.85 },
                { diagnosis: 'Periodontitis', icd_code: 'K05.30', confidence: 0.70 }
            ]
        };

        const suggestions = symptoms
            .flatMap(symptom => diagnosisMap[symptom] || [])
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 3);

        return suggestions;
    }

    // Endodontics: RCT Tracking
    async saveRCTData(dentalRecordId: string, toothNumber: number, data: any) {
        return this.prisma.clinicalNote.create({
            data: {
                dental_record_id: dentalRecordId,
                note_type: 'RCT_TRACKING',
                content: JSON.stringify({
                    tooth: toothNumber,
                    cavity_class: data.cavityClass, // I, II, III, IV, V, VI
                    working_length: data.workingLength,
                    master_cone: data.masterCone,
                    obturation_date: data.obturationDate,
                    follow_up: data.followUp
                }),
                created_by_id: data.doctorId
            }
        });
    }

    // Oral Surgery: WAR Assessment (Winter, Archer, Rood)
    async calculateWARScore(data: {
        angulation: string;
        depth: string;
        relationToRamus: string;
    }) {
        let score = 0;

        // Angulation
        if (data.angulation === 'MESIOANGULAR') score += 1;
        else if (data.angulation === 'HORIZONTAL') score += 2;
        else if (data.angulation === 'DISTOANGULAR') score += 3;

        // Depth
        if (data.depth === 'LEVEL_A') score += 1;
        else if (data.depth === 'LEVEL_B') score += 2;
        else if (data.depth === 'LEVEL_C') score += 3;

        // Relation to Ramus
        if (data.relationToRamus === 'CLASS_II') score += 1;
        else if (data.relationToRamus === 'CLASS_III') score += 2;

        const difficulty = score <= 3 ? 'EASY' : score <= 6 ? 'MODERATE' : 'DIFFICULT';

        return { score, difficulty };
    }

    // Orthodontics: Save Cephalometric Data
    async saveCephalometricData(dentalRecordId: string, data: any) {
        return this.prisma.clinicalNote.create({
            data: {
                dental_record_id: dentalRecordId,
                note_type: 'CEPHALOMETRIC',
                content: JSON.stringify({
                    sna: data.sna,
                    snb: data.snb,
                    anb: data.anb,
                    facial_angle: data.facialAngle,
                    profile_type: data.profileType // STRAIGHT, CONVEX, CONCAVE
                }),
                created_by_id: data.doctorId
            }
        });
    }

    // ICD-10 Code Lookup
    async searchICDCode(searchTerm: string) {
        return this.prisma.iCDCode.findMany({
            where: {
                OR: [
                    { code: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } }
                ]
            },
            take: 10
        });
    }

    // Media Vault: Upload Clinical Asset
    async uploadClinicalAsset(data: {
        clinicId: string;
        patientId?: string;
        type: string;
        url: string;
        metadata?: any;
    }) {
        return this.prisma.clinicAsset.create({
            data: {
                clinic_id: data.clinicId,
                patient_id: data.patientId,
                type: data.type,
                url: data.url,
                metadata: data.metadata
            }
        });
    }

    // Get Clinical Assets for Patient
    async getPatientAssets(patientId: string) {
        return this.prisma.clinicAsset.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: 'desc' }
        });
    }

    // Medication Tracker: Log Patient Adherence
    async logMedication(data: {
        patientId: string;
        drugName: string;
        status: 'TAKEN' | 'MISSED';
        notes?: string;
    }) {
        return this.prisma.medicationLog.create({
            data: {
                patient_id: data.patientId,
                drug_name: data.drugName,
                status: data.status,
                notes: data.notes
            }
        });
    }

    // Get Medication History
    async getMedicationHistory(patientId: string, days: number = 7) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return this.prisma.medicationLog.findMany({
            where: {
                patient_id: patientId,
                logged_at: { gte: startDate }
            },
            orderBy: { logged_at: 'desc' }
        });
    }
}
