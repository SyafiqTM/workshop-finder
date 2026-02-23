import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.review.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.workshop.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      name: 'Demo User',
      email: 'demo@example.com',
      password
    }
  });

  const workshops = await prisma.workshop.createMany({
    data: [
      {
        name: 'AutoFix Downtown',
        address: '12 Main St, City Center',
        latitude: 40.7128,
        longitude: -74.006,
        phone: '+1-555-0101',
        description: 'General repairs, diagnostics, and maintenance.',
        images: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200'
      },
      {
        name: 'Rapid Tyres & Service',
        address: '220 West End Ave',
        latitude: 40.7228,
        longitude: -73.996,
        phone: '+1-555-0102',
        description: 'Tyre replacement, balancing, and wheel alignment.',
        images: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200'
      },
      {
        name: 'Premium Motors Lab',
        address: '48 Industrial Rd',
        latitude: 40.7028,
        longitude: -74.016,
        phone: '+1-555-0103',
        description: 'Engine tuning, electrical repairs, and detailing.',
        images: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=1200'
      }
    ]
  });

  const createdWorkshops = await prisma.workshop.findMany();

  await prisma.favorite.create({
    data: {
      userId: user.id,
      workshopId: createdWorkshops[0].id
    }
  });

  await prisma.review.create({
    data: {
      rating: 5,
      comment: 'Excellent and quick service.',
      userId: user.id,
      workshopId: createdWorkshops[0].id
    }
  });

  console.log(`Seed complete. Inserted ${workshops.count} workshops.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
