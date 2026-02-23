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
        name: 'Setapak AutoCare Centre',
        address: 'Jalan Genting Klang, Setapak, 53300 Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.199,
        longitude: 101.7311,
        phone: '+60-3-4141-2101',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'General repairs, diagnostics, and periodic maintenance.',
        images: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200'
      },
      {
        name: 'Genting Klang Tyre & Alignment',
        address: 'Taman Danau Kota, Setapak, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.1968,
        longitude: 101.7282,
        phone: '+60-3-4141-2102',
        opensAt: '09:00',
        closesAt: '19:00',
        description: 'Tyre replacement, wheel balancing, and alignment services.',
        images: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200'
      },
      {
        name: 'Wangsa Maju Motor Lab',
        address: 'Seksyen 2 Wangsa Maju, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.2058,
        longitude: 101.7392,
        phone: '+60-3-4141-2103',
        opensAt: '09:00',
        closesAt: '19:00',
        description: 'Engine tuning, electrical repairs, and car detailing.',
        images: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=1200'
      },
      {
        name: 'Keramat Service Hub',
        address: 'Jalan AU 1A/4, Keramat, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.1749,
        longitude: 101.747,
        phone: '+60-3-4141-2104',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Brake service, suspension checks, and battery replacement.',
        images: 'https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?q=80&w=1200'
      },
      {
        name: 'Gombak Rapid Workshop',
        address: 'Jalan Gombak, Batu 4, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.2162,
        longitude: 101.7245,
        phone: '+60-3-4141-2105',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Fast servicing, aircond maintenance, and diagnostics.',
        images: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200'
      },
      {
        name: 'KL North Auto Diagnostics',
        address: 'Taman Melati, Setapak, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.2223,
        longitude: 101.7357,
        phone: '+60-3-4141-2106',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Computer diagnostics, fuel system service, and oil change.',
        images: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=1200'
      },
      {
        name: 'Balakong Auto Pro',
        address: 'Jalan Balakong, 43300 Seri Kembangan, Selangor',
        city: 'Balakong',
        latitude: 3.0336,
        longitude: 101.7475,
        phone: '+60-3-8961-4001',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'General maintenance, brake service, and aircond checks.',
        images: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=1200'
      },
      {
        name: 'Balakong Tyre & Battery',
        address: 'Taman Impian Ehsan, Balakong, Selangor',
        city: 'Balakong',
        latitude: 3.0321,
        longitude: 101.7422,
        phone: '+60-3-8961-4002',
        opensAt: '09:00',
        closesAt: '19:00',
        description: 'Tyre replacement, balancing, battery and alternator services.',
        images: 'https://images.unsplash.com/photo-1498889444388-e67ea62c464b?q=80&w=1200'
      },
      {
        name: 'Seri Kembangan Motor Works',
        address: 'Jalan SK 6/1, Seri Kembangan, Selangor',
        city: 'Balakong',
        latitude: 3.0288,
        longitude: 101.7508,
        phone: '+60-3-8961-4003',
        opensAt: '09:00',
        closesAt: '19:00',
        description: 'Engine diagnostics, transmission servicing, and detailing.',
        images: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200'
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
