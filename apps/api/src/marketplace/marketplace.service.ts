import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Clinic } from '@prisma/client';

@Injectable()
export class MarketplaceService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Find clinics within a certain radius using Haversine formula
     * Note: This is a JS-level filter for simplicity. For production scaling, enable PostGIS.
     */
    async findNearbyClinics(lat: number, lng: number, radiusKm: number): Promise<Clinic[]> {
        // 1. Fetch all 'active' marketplace clinics
        // Optimization: In real world, we would use raw SQL with geometry types or a bounding box first.
        // For MVP/Trinity pivot, fetching active clinics is likely a small dataset (<1000).
        const activeClinics = await this.prisma.clinic.findMany({
            where: {
                is_marketplace_active: true,
                discovery_enabled: true,
                latitude: { not: null },
                longitude: { not: null },
            },
        });

        // 2. Filter by distance
        return activeClinics.filter((clinic) => {
            const distance = this.getDistanceFromLatLonInKm(lat, lng, clinic.latitude!, clinic.longitude!);
            return distance <= radiusKm;
        });
    }

    // Haversine Formula
    private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}
