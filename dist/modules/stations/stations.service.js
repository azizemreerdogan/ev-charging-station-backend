import { prisma } from "../../db/client.js";
import { ValidationError } from "../../utils/errors.js";
import { GoogleMapsUnavailableError, geocodeAddress, isGoogleMapsEnabled, } from "../../services/google-maps.js";
/**
 * Persist a new station. If lat/lng are missing, the address is geocoded via
 * Google Maps (UC-03). Without a Google API key, lat/lng become required.
 */
export async function createStation(input) {
    let latitude = input.latitude;
    let longitude = input.longitude;
    let address = input.address;
    if (latitude === undefined || longitude === undefined) {
        if (!isGoogleMapsEnabled()) {
            throw new ValidationError("latitude/longitude are required when GOOGLE_MAPS_API_KEY is not configured");
        }
        try {
            const geo = await geocodeAddress(input.address);
            latitude = geo.latitude;
            longitude = geo.longitude;
            address = geo.formattedAddress;
        }
        catch (err) {
            if (err instanceof GoogleMapsUnavailableError) {
                throw new ValidationError(err.message);
            }
            throw err;
        }
    }
    return prisma.chargingStation.create({
        data: {
            operatorId: input.operatorId,
            name: input.name,
            address,
            latitude,
            longitude,
            operatingHours: input.operatingHours ?? "24/7",
            amenities: input.amenities ?? [],
        },
    });
}
//# sourceMappingURL=stations.service.js.map