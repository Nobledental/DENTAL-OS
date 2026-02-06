import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AcademicService {
    constructor(private prisma: PrismaService) { }

    /**
     * Generates a daily sprint (mock test) for a student.
     * Implements Grade-Aware Filtering and Spaced Repetition (Revision Loop).
     */
    async getDailySprint(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) return [];

        const userYear = user.current_year || 1;

        // 1. CUMULATIVE LOGIC: Fetch questions where subject_year <= user.current_year
        // 2. REVISION LOOP: 20% of the questions are pulled from previous years

        const totalQuestions = 10;
        const revisionCount = Math.floor(totalQuestions * 0.2); // 20%
        const currentYearCount = totalQuestions - revisionCount;

        // Fetch current year questions
        const currentQuestions = await this.prisma.mCQ.findMany({
            where: { subjectYear: userYear },
            take: currentYearCount,
        });

        // Fetch revision questions (from years < currentYear)
        const revisionQuestions = await this.prisma.mCQ.findMany({
            where: {
                subjectYear: { lt: userYear }
            },
            take: revisionCount,
        });

        // Combine and shuffle (shuffle omitted for brevity, usually done in memory or via SQL random)
        return [...currentQuestions, ...revisionQuestions];
    }

    /**
     * GraphRAG Dynamic Filter: Retrieve textbook nodes appropriate for student's level.
     */
    async getGraphRAGResults(userId: string, query: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const userYear = user?.current_year || 4;

        // Simulation of Vector DB + Metadata Filter
        // In reality, this would query a Vector Store like Pinecone/Weaviate with metadata filters
        return this.prisma.academicNode.findMany({
            where: {
                yearLevel: { lte: userYear },
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { content: { contains: query, mode: 'insensitive' } },
                ]
            }
        });
    }

    async createAcademicNode(data: { title: string; content: string; yearLevel: number; tags: string[] }) {
        return this.prisma.academicNode.create({ data });
    }

    async createMCQ(data: { question: string; options: any; answer: string; subjectYear: number }) {
        return this.prisma.mCQ.create({ data });
    }
}
