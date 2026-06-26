const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Create Drivers
  const driver1 = await prisma.user.create({
    data: {
      name: 'Michael Johnson',
      email: 'michael@ctms.edu',
      password: 'password123',
      role: 'driver',
      phone: '+123456789',
      license: 'TN-DL-123456',
      status: 'active'
    }
  });

  const driver2 = await prisma.user.create({
    data: {
      name: 'Rob Vance',
      email: 'rob@ctms.edu',
      password: 'password123',
      role: 'driver',
      phone: '+987654321',
      license: 'TN-DL-654321',
      status: 'active'
    }
  });

  // 2. Create Vehicles
  await prisma.vehicle.create({
    data: {
      number: 'TN-45-AT-0012',
      type: 'Bus',
      model: 'Tata Motors',
      capacity: 60,
      route: 'Downtown Route A',
      status: 'active',
      driverId: driver1.id
    }
  });

  await prisma.vehicle.create({
    data: {
      number: 'TN-45-AT-1123',
      type: 'Bus',
      model: 'Ashok Leyland',
      capacity: 50,
      route: 'Uptown Route B',
      status: 'active',
      driverId: driver2.id
    }
  });

  // 3. Create Students
  await prisma.user.create({
    data: {
      name: 'Alice Cooper',
      email: 'alice@ctms.edu',
      password: 'password123',
      role: 'student',
      phone: '+91 9000011111',
      department: 'Computer Science',
      year: '3rd Year',
      status: 'active'
    }
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
