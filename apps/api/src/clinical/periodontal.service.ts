import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface PeriodontalChart {
    chartDate: string;
    examiner: string;
    teeth: any[];
    totalSites: number;
    sitesWithPD4plus: number;
    sitesWithPD5plus: number;
    bopPercentage: number;
    aapStage?: string;
    isActive: boolean;
}

interface SurgeryRecord {
    id: string;
    date: string;
    procedure: string;
    teethInvolved: number[];
    sutureMaterial?: string;
    sutureRemovalDate?: string;
    notes: string;
}

interface PerioMetadata {
    charts: PeriodontalChart[];
    surgeries: SurgeryRecord[];
    alerts: any[];
}

interface SavePeriodontalDto {
    patientId: string;
    metadata: PerioMetadata;
}

@Injectable()
export class PeriodontalService {
    constructor(private prisma: PrismaService) { }

    async savePeriodontalChart(data: SavePeriodontalDto) {
        const latestChart = data.metadata.charts[data.metadata.charts.length - 1];

        const clinicalNote = await this.prisma.clinicalNote.create({
            data: {
                patient_id: data.patientId,
                note_type: 'PERIO_CHART',
                chief_complaint: 'Periodontal Assessment',
                diagnosis: this.generateDiagnosisText(latestChart),
                clinical_findings: JSON.stringify({
                    perio_charting: data.metadata
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
            message: 'Periodontal chart saved successfully',
            summary: {
                totalSites: latestChart.totalSites,
                sitesWithPD5plus: latestChart.sitesWithPD5plus,
                bopPercentage: latestChart.bopPercentage,
                isActive: latestChart.isActive,
                aapStage: latestChart.aapStage
            }
        };
    }

    async getPeriodontalHistory(patientId: string) {
        const notes = await this.prisma.clinicalNote.findMany({
            where: {
                patient_id: patientId,
                note_type: 'PERIO_CHART'
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return notes.map(note => ({
            id: note.id,
            metadata: note.clinical_findings ? JSON.parse(note.clinical_findings as string).perio_charting : null,
            diagnosis: note.diagnosis,
            createdAt: note.created_at
        }));
    }

    async getSutureReminders(clinicId: string) {
        // Get all perio charts from last 30 days to find upcoming suture removals
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const notes = await this.prisma.clinicalNote.findMany({
            where: {
                note_type: 'PERIO_CHART',
                created_at: {
                    gte: thirtyDaysAgo
                }
            },
            include: {
                patient: true
            }
        });

        const reminders: any[] = [];
        const today = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);

        notes.forEach(note => {
            try {
                const metadata = JSON.parse(note.clinical_findings as string).perio_charting as PerioMetadata;

                metadata.surgeries?.forEach(surgery => {
                    if (surgery.sutureRemovalDate) {
                        const removalDate = new Date(surgery.sutureRemovalDate);
                        if (removalDate >= today && removalDate <= nextWeek) {
                            reminders.push({
                                patientId: note.patient_id,
                                patientName: (note.patient as any)?.name || 'Unknown',
                                surgeryDate: surgery.date,
                                procedure: surgery.procedure,
                                sutureRemovalDate: surgery.sutureRemovalDate,
                                teethInvolved: surgery.teethInvolved
                            });
                        }
                    }
                });
            } catch (e) {
                // Skip malformed data
            }
        });

        return reminders;
    }

    private generateDiagnosisText(chart: PeriodontalChart): string {
        const parts: string[] = [];

        if (chart.aapStage) {
            parts.push(`AAP Stage ${chart.aapStage} Periodontitis`);
        }

        if (chart.isActive) {
            parts.push('Active Disease (BOP > 10%)');
        }

        if (chart.sitesWithPD5plus > 0) {
            parts.push(`${chart.sitesWithPD5plus} sites with PD ≥ 5mm`);
        }

        if (chart.sitesWithPD4plus > 0 && chart.sitesWithPD4plus > chart.sitesWithPD5plus) {
            const gingivitisSites = chart.sitesWithPD4plus - chart.sitesWithPD5plus;
            parts.push(`${gingivitisSites} sites with gingivitis (PD 4mm)`);
        }

        if (parts.length === 0) {
            if (chart.totalSites > 0) {
                return 'Periodontal health within normal limits';
            }
            return 'Periodontal examination incomplete';
        }

        return parts.join('; ');
    }
}
