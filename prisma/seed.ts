import { PrismaClient, ConnectorType } from "@prisma/client";
import argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
    const passwordHash = await argon2.hash("password123");

    const operator = await prisma.user.upsert({
        where: { email: "operator@greencharge.dev" },
        update: {},
        create: {
            email: "operator@greencharge.dev",
            passwordHash,
            name: "GreenCharge Operator",
            role: "OPERATOR",
        },
    });

    const owner = await prisma.user.upsert({
        where: { email: "owner@example.dev" },
        update: {},
        create: {
            email: "owner@example.dev",
            passwordHash,
            name: "Sample Owner",
            role: "VEHICLE_OWNER",
        },
    });

    await prisma.vehicle.upsert({
        where: { licensePlate: "EV-001" },
        update: {},
        create: {
            userId: owner.id,
            make: "Tesla",
            model: "Model 3",
            year: 2024,
            licensePlate: "EV-001",
            batteryKwh: 75,
            connectorTypes: [ConnectorType.CCS, ConnectorType.TESLA],
            nickname: "Daily driver",
        },
    });

    const stations = [
        {
            name: "Downtown Hub",
            latitude: 41.0082,
            longitude: 28.9784,
            address: "Karaköy, İstanbul",
            connectors: [
                { type: ConnectorType.CCS, powerKw: 150, pricePerKwh: "0.30" },
                { type: ConnectorType.TYPE_2, powerKw: 22, pricePerKwh: "0.20" },
            ],
        },
        {
            name: "Airport Plaza",
            latitude: 40.9769,
            longitude: 28.8146,
            address: "İstanbul Havalimanı yolu",
            connectors: [
                { type: ConnectorType.CCS, powerKw: 350, pricePerKwh: "0.40" },
                { type: ConnectorType.CHADEMO, powerKw: 50, pricePerKwh: "0.28" },
            ],
        },
        {
            name: "Suburb Mall",
            latitude: 41.0431,
            longitude: 29.0061,
            address: "Kadıköy AVM",
            connectors: [
                { type: ConnectorType.TESLA, powerKw: 250, pricePerKwh: "0.35" },
                { type: ConnectorType.TYPE_2, powerKw: 22, pricePerKwh: "0.18" },
            ],
        },
    ];

    for (const s of stations) {
        const existing = await prisma.chargingStation.findFirst({
            where: { name: s.name, operatorId: operator.id },
        });
        const station =
            existing ??
            (await prisma.chargingStation.create({
                data: {
                    operatorId: operator.id,
                    name: s.name,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    address: s.address,
                    amenities: ["WiFi", "Restroom"],
                },
            }));

        for (const [idx, c] of s.connectors.entries()) {
            await prisma.connector.upsert({
                where: {
                    stationId_connectorNumber: {
                        stationId: station.id,
                        connectorNumber: idx + 1,
                    },
                },
                update: {},
                create: {
                    stationId: station.id,
                    connectorNumber: idx + 1,
                    type: c.type,
                    powerKw: c.powerKw,
                    pricePerKwh: c.pricePerKwh,
                    timeRatePerHour: "0.10",
                },
            });
        }
    }

    console.log("Seed complete:");
    console.log("  operator login: operator@greencharge.dev / password123");
    console.log("  owner login:    owner@example.dev / password123");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
