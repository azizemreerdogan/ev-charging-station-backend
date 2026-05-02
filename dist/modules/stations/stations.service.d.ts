export interface CreateStationInput {
    operatorId: string;
    name: string;
    address: string;
    latitude?: number;
    longitude?: number;
    operatingHours?: string;
    amenities?: string[];
}
/**
 * Persist a new station. If lat/lng are missing, the address is geocoded via
 * Google Maps (UC-03). Without a Google API key, lat/lng become required.
 */
export declare function createStation(input: CreateStationInput): Promise<{
    name: string;
    id: string;
    status: import("@prisma/client").$Enums.StationStatus;
    createdAt: Date;
    latitude: number;
    longitude: number;
    address: string;
    operatingHours: string;
    amenities: string[];
    rating: number | null;
    operatorId: string;
}>;
//# sourceMappingURL=stations.service.d.ts.map