import { Controller, Get, Query } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { Clinic } from '@prisma/client';

@Controller('marketplace')
export class MarketplaceController {
    constructor(private readonly marketplaceService: MarketplaceService) { }

    @Get('nearby')
    async findNearbyClinics(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius: string, // in km
    ): Promise<Clinic[]> {
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lng);
        const radiusKm = parseFloat(radius) || 10; // Default 10km

        return this.marketplaceService.findNearbyClinics(latitude, longitude, radiusKm);
    }
}
