import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface SaveEndoSittingDto {
    dentalRecordId: string;
    patientId: string;
    metadata: any; // EndodonticMetadata from frontend
}

@Injectable()
export class EndodonticService {
    constructor(private prisma: PrismaService) { }

    async saveSittingData(data: SaveEndoSittingDto) {
        // Create Clinical Note with Endodontic metadata
        const clinicalNote = await this.prisma.clinicalNote.create({
            data: {
                patient_id: data.patientId,
                dental_record_id: data.dentalRecordId,
                department: 'ENDODONTICS',
                note_type: 'RCT_MULTI_SITTING',
                metadata: data.metadata as any,
                diagnosis: `RCT - Tooth #${data.metadata.toothNumber}`
            }
        });

        return {
            success: true,
            clinicalNoteId: clinicalNote.id,
            message: 'Endodontic data saved successfully'
        };
    }

    async getSittingHistory(dentalRecordId: string) {
        const notes = await this.prisma.clinicalNote.findMany({
            where: {
                dental_record_id: dentalRecordId,
                department: 'ENDODONTICS',
                note_type: 'RCT_MULTI_SITTING'
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        return notes.map(note => ({
            id: note.id,
            toothNumber: (note.metadata as any)?.toothNumber,
            sittings: (note.metadata as any)?.sittings || [],
            obturated: (note.metadata as any)?.obturated || false,
            createdAt: note.created_at
        }));
    }

    async completeObturation(clinicalNoteId: string, obturationDate: string) {
        const note = await this.prisma.clinicalNote.update({
            where: { id: clinicalNoteId },
            data: {
                metadata: {
                    ...(note.metadata as any),
                    obturated: true,
                    obturationDate
                } as any
            }
        });

        return {
            success: true,
            message: 'Obturation marked as complete'
        };
    }
}
