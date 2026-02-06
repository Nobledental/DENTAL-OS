import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { AcademicService } from './academic.service';

@Controller('academic')
export class AcademicController {
    constructor(private readonly academicService: AcademicService) { }

    @Get('sprint/:userId')
    async getDailySprint(@Param('userId') userId: string) {
        return this.academicService.getDailySprint(userId);
    }

    @Get('rag/:userId')
    async searchGraphRAG(
        @Param('userId') userId: string,
        @Query('q') query: string
    ) {
        return this.academicService.getGraphRAGResults(userId, query);
    }

    @Post('node')
    async createNode(@Body() data: any) {
        return this.academicService.createAcademicNode(data);
    }

    @Post('mcq')
    async createMCQ(@Body() data: any) {
        return this.academicService.createMCQ(data);
    }
}
