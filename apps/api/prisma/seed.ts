import { PrismaClient } from '@prisma/client';
import { CustomerStatus, RequirementStatus, VehicleStatus, FuelType, TransmissionType, DealerRole } from '@dealconnect/shared-types';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding development database according to 15_SAMPLE_SEED_DATA.md...');

  // 1. Seed Dealer "Sharma Motors"
  const dealer = await prisma.dealer.upsert({
    where: { slug: 'sharma-motors' },
    update: {},
    create: {
      name: 'Sharma Motors',
      slug: 'sharma-motors',
      phone: '+919876543210',
      email: 'contact@sharmamotors.com',
      status: 'active',
    },
  });
  console.log(`Seeded Dealer: ${dealer.name} (${dealer.slug})`);

  // 2. Seed Dealer User (Owner)
  const user = await prisma.user.create({
    data: {
      name: 'Sharma Owner',
      email: 'owner@sharmamotors.com',
      phone: '+919876543210',
      passwordHash: bcrypt.hashSync('password123', 10),
      authStatus: 'active',
      dealerUsers: {
        create: {
          dealerId: dealer.id,
          role: DealerRole.OWNER,
          status: 'active',
        },
      },
    },
  });
  console.log(`Seeded User: ${user.name}`);

  // 3. Seed Customer "Rahul Sharma"
  const customer = await prisma.customer.upsert({
    where: {
      dealerId_normalizedPhone: {
        dealerId: dealer.id,
        normalizedPhone: '+919876543210',
      },
    },
    update: {},
    create: {
      dealerId: dealer.id,
      name: 'Rahul Sharma',
      normalizedPhone: '+919876543210',
      email: 'rahul@example.com',
      status: CustomerStatus.ACTIVE,
    },
  });
  console.log(`Seeded Customer: ${customer.name} (${customer.normalizedPhone})`);

  // 4. Seed Requirement (Hyundai Creta)
  const requirement = await prisma.requirement.create({
    data: {
      dealerId: dealer.id,
      customerId: customer.id,
      status: RequirementStatus.SEARCHING,
      priority: 'normal',
      source: 'customer_portal',
      notes: 'Prefer white color',
      preferences: {
        create: {
          make: 'Hyundai',
          model: 'Creta',
          minYear: 2021,
          maxYear: 2024,
          minPrice: 900000,
          maxPrice: 1100000,
          fuel: FuelType.PETROL,
          transmission: TransmissionType.AUTOMATIC,
          maxKm: 60000,
        },
      },
    },
  });
  console.log(`Seeded Requirement ID: ${requirement.id}`);

  // 5. Seed Vehicle (SM-1024 Creta)
  const vehicle = await prisma.vehicle.upsert({
    where: {
      dealerId_stockNumber: {
        dealerId: dealer.id,
        stockNumber: 'SM-1024',
      },
    },
    update: {},
    create: {
      dealerId: dealer.id,
      stockNumber: 'SM-1024',
      make: 'Hyundai',
      model: 'Creta',
      variant: 'SX',
      year: 2022,
      price: 1020000,
      fuel: FuelType.PETROL,
      transmission: TransmissionType.AUTOMATIC,
      kilometers: 42000,
      status: VehicleStatus.AVAILABLE,
      description: 'Single owner, pristine condition, full service history.',
    },
  });
  console.log(`Seeded Vehicle: ${vehicle.stockNumber} (${vehicle.make} ${vehicle.model})`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
