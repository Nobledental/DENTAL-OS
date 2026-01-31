import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Diagnostic Knowledge Base Interface
interface DiagnosticRule {
    diagnosis: string;
    icd10Code: string;
    category: string;
    symptoms: string[];
    clinicalFindings: string[];
    vitalSigns?: string[];
    differentialScore: number;
}

@Injectable()
export class ClinicalSpecialistService {
    constructor(private prisma: PrismaService) { }

    // AI Provisional Diagnosis with comprehensive scoring
    async getProvisionalDiagnosis(input: { symptoms: string[]; clinicalFindings: string[]; vitalSigns?: string[] }) {
        // Diagnostic Knowledge Base (in production, move to database)
        const diagnosticKB: DiagnosticRule[] = [
            {
                diagnosis: 'Irreversible Pulpitis',
                icd10Code: 'K04.02',
                category: 'Pulpal',
                symptoms: ['spontaneous_pain', 'throbbing_pain', 'radiating_pain', 'nocturnal_pain'],
                clinicalFindings: ['pain_worse_lying_down', 'lingering_cold_pain'],
                differentialScore: 0.90
            },
            {
                diagnosis: 'Periapical Abscess (Acute)',
                icd10Code: 'K04.7',
                category: 'Periapical',
                symptoms: ['severe_throbbing', 'swelling', 'pus_discharge', 'fever'],
                clinicalFindings: ['fluctuant_swelling', 'tender_to_percussion'],
                vitalSigns: ['elevated_temperature'],
                differentialScore: 0.92
            },
            {
                diagnosis: 'Pericoronitis',
                icd10Code: 'K05.22',
                category: 'Periodontal',
                symptoms: ['pain_wisdom_tooth', 'difficulty_opening_mouth'],
                clinicalFindings: ['inflamed_operculum', 'partially_erupted_tooth', 'trismus'],
                differentialScore: 0.90
            },
            {
                diagnosis: 'Alveolar Osteitis (Dry Socket)',
                icd10Code: 'K04.7',
                category: 'Post-Surgical',
                symptoms: ['intense_boring_pain', 'pain_3_days_post_extraction'],
                clinicalFindings: ['empty_socket', 'exposed_bone', 'foul_odor'],
                differentialScore: 0.93
            }
        ];

        const matches = diagnosticKB.map(rule => {
            const symptomMatches = input.symptoms.filter(s => rule.symptoms.includes(s)).length;
            const findingMatches = input.clinicalFindings.filter(f => rule.clinicalFindings.includes(f)).length;

            const symptomScore = rule.symptoms.length > 0 ? symptomMatches / rule.symptoms.length : 0;
            const findingScore = rule.clinicalFindings.length > 0 ? findingMatches / rule.clinicalFindings.length : 0;

            let matchScore = (symptomScore + findingScore) / 2;

            if (rule.vitalSigns && input.vitalSigns) {
                const vitalMatches = input.vitalSigns.filter(v => rule.vitalSigns!.includes(v)).length;
                const vitalScore = vitalMatches / rule.vitalSigns.length;
                matchScore = (symptomScore + findingScore + vitalScore) / 3;
            }

            const confidence = Math.min(matchScore * rule.differentialScore, 0.98);

            return {
                diagnosis: rule.diagnosis,
                icd_code: rule.icd10Code,
                category: rule.category,
                confidence,
                matchedSymptoms: symptomMatches,
                matchedFindings: findingMatches
            };
        }).filter(r => r.confidence > 0.3)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);

        return matches;
    }

    // Endodontics: RCT Tracking
    async saveRCTData(dentalRecordId: string, toothNumber: number, data: any) {
        return await this.prisma.clinicalNote.create({
            data: {
                dental_record_id: dentalRecordId,
                department: 'ENDODONTICS',
                note_type: 'RCT_TRACKING',
                metadata: {
                    tooth: toothNumber,
                    cavity_class: data.cavityClass,
                    working_length: data.workingLength,
                    master_cone: data.masterCone,
                    obturation_date: data.obturationDate
                } as any
            }
        });
    }

    // Oral Surgery: WAR Assessment (Winter, Archer, Rood)
    async calculateWARScore(data: { angulation: string; depth: string; relationToRamus: string }) {
        let score = 0;

        // Angulation
        if (data.angulation === 'MESIOANGULAR') score += 1;
        else if (data.angulation === 'HORIZONTAL') score += 2;
        else if (data.angulation === 'DISTOANGULAR') score += 3;

        // Depth
        if (data.depth === 'POSITION_B') score += 2;
        else if (data.depth === 'POSITION_C') score += 3;
        else score += 1; // POSITION_A

        // Relation to Ramus
        if (data.relationToRamus === 'CLASS_II') score += 2;
        else if (data.relationToRamus === 'CLASS_III') score += 3;
        else score += 1; // CLASS_I

        const difficulty = score <= 4 ? 'EASY' : score <= 7 ? 'MODERATE' : 'DIFFICULT';

        return { score, difficulty };
    }

    // Orthodontics: Save Cephalometric Data
    async saveCephalometricData(dentalRecordId: string, data: any) {
        return await this.prisma.clinicalNote.create({
            data: {
                dental_record_id: dentalRecordId,
                department: 'ORTHODONTICS',
                note_type: 'CEPHALOMETRIC',
                metadata: {
                    sna: data.sna,
                    snb: data.snb,
                    anb: data.anb,
                    facial_angle: data.facialAngle,
                    profile_type: data.profileType
                } as any
            }
        });
    }

    // ICD-10 Code Lookup
    async searchICDCode(searchTerm: string) {
        // In production, query actual ICD-10 database
        // For now, return from in-memory mapping
        const icd10KB = [
            { code: 'K04.01', description: 'Reversible Pulpitis' },
            { code: 'K04.02', description: 'Irreversible Pulpitis' },
            { code: 'K04.1', description: 'Pulp Necrosis' },
            { code: 'K04.4', description: 'Acute Apical Periodontitis' },
            { code: 'K04.7', description: 'Periapical Abscess / Dry Socket' },
            { code: 'K05.22', description: 'Pericoronitis' },
            { code: 'K05.10', description: 'Gingivitis' },
            { code: 'K05.30', description: 'Chronic Periodontitis' }
        ];

        return icd10KB.filter(item =>
            item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }

    // Media Vault: Upload Clinical Asset
    async uploadClinicalAsset(data: { clinicId: string; patientId?: string; type: string; url: string; metadata?: any }) {
        return await this.prisma.clinicAsset.create({
            data: {
                clinic_id: data.clinicId,
                patient_id: data.patientId,
                type: data.type,
                url: data.url,
                metadata: data.metadata as any
            }
        });
    }

    // Get Clinical Assets for Patient
    async getPatientAssets(patientId: string) {
        return await this.prisma.clinicAsset.findMany({
            where: { patient_id: patientId },
            orderBy: { created_at: 'desc' }
        });
    }

    // Medication Tracker: Log Patient Adherence
    async logMedication(data: { patientId: string; drugName: string; status: 'TAKEN' | 'MISSED'; notes?: string }) {
        return await this.prisma.medicationLog.create({
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

        return await this.prisma.medicationLog.findMany({
            where: {
                patient_id: patientId,
                logged_at: { gte: startDate }
            },
            orderBy: { logged_at: 'desc' }
        });
    }
}
