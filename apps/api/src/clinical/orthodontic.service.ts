import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Define interfaces inline since we can't import from frontend types
interface OrthodonticMetadata {
    cephalometricLandmarks: any[];
    angles?: any;
    profileAnalysis?: any;
    aldCalculation?: any;
    milestones: any[];
    bondingDate?: string;
    estimatedDebondingDate?: string;
    xrayAssetId?: string;
}

interface SaveOrthodonticDto {
    patientId: string;
    metadata: OrthodonticMetadata;
}

@Injectable()
export class OrthodonticService {
    constructor(private prisma: PrismaService) { }

    async saveOrthodonticAnalysis(data: SaveOrthodonticDto) {
        // Create Clinical Note with Orthodontic metadata
        const clinicalNote = await this.prisma.clinicalNote.create({
            data: {
                patient_id: data.patientId,
                note_type: 'ORTHO_CASE_ANALYSIS',
                chief_complaint: 'Orthodontic Case Analysis',
                diagnosis: this.generateDiagnosisText(data.metadata),
                clinical_findings: JSON.stringify({
                    ortho_analysis: data.metadata
                }),
                visit_vitals: {},
                systemic_review: {},
                lab_orders: {},
                prescriptions: []
            }
        });

        return {
            success: true,
            clinicalNoteId: clinicalNote.id,
            message: 'Orthodontic case analysis saved successfully'
        };
    }

    async getOrthodonticHistory(patientId: string) {
        const notes = await this.prisma.clinicalNote.findMany({
            where: {
                patient_id: patientId,
                note_type: 'ORTHO_CASE_ANALYSIS'
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return notes.map(note => ({
            id: note.id,
            metadata: note.clinical_findings ? JSON.parse(note.clinical_findings as string).ortho_analysis : null,
            diagnosis: note.diagnosis,
            createdAt: note.created_at
        }));
    }

    async generateCasePresentation(patientId: string, clinicalNoteId: string) {
        const note = await this.prisma.clinicalNote.findUnique({
            where: { id: clinicalNoteId }
        });

        if (!note) {
            throw new Error('Clinical note not found');
        }

        const metadata = note.clinical_findings ? JSON.parse(note.clinical_findings as string).ortho_analysis : null;

        // TODO: Implement PDF generation
        // This would integrate with a PDF library to generate:
        // - Cephalometric analysis with angles
        // - Profile analysis with measurements
        // - ALD calculation and treatment plan
        // - Treatment timeline with milestones

        return {
            success: true,
            message: 'Case presentation generated',
            metadata
        };
    }

    private generateDiagnosisText(metadata: OrthodonticMetadata): string {
        const parts: string[] = [];

        if (metadata.angles) {
            parts.push(`${metadata.angles.skeletalClass} skeletal pattern`);
            parts.push(`${metadata.angles.verticalPattern} growth pattern`);
        }

        if (metadata.profileAnalysis) {
            parts.push(`${metadata.profileAnalysis.profileType} profile`);
        }

        if (metadata.aldCalculation) {
            const upperCrowding = Math.abs(metadata.aldCalculation.upperDiscrepancy);
            const lowerCrowding = Math.abs(metadata.aldCalculation.lowerDiscrepancy);

            if (metadata.aldCalculation.upperDiscrepancy < 0) {
                parts.push(`Upper arch crowding: ${upperCrowding}mm`);
            }
            if (metadata.aldCalculation.lowerDiscrepancy < 0) {
                parts.push(`Lower arch crowding: ${lowerCrowding}mm`);
            }

            parts.push(`Treatment: ${metadata.aldCalculation.recommendation}`);
        }

        return parts.join('; ');
    }
}
