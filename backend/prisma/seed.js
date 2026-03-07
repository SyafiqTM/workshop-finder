import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const roundTheClockSchedule = JSON.stringify(
  Object.fromEntries(
    DAYS.map((day) => [day, { opensAt: '00:00', closesAt: '23:59', off: false }])
  )
);
const twentyFourHourAvailability = {
  opensAt: '00:00',
  closesAt: '23:59',
  schedule: roundTheClockSchedule
};

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
      password,
      phone: '+60-12-345 6789',
      carModel: 'Toyota Vios 2021',
      currentMileage: 48250,
      lastEngineOilChangeMileage: 43000,
      lastAtfChangeMileage: 20000,
      mileageRecords: [
        {
          mileage: 48250,
          recordedAt: '2026-03-01T09:15:00.000Z',
          note: 'Weekly odometer update'
        },
        {
          mileage: 46000,
          recordedAt: '2026-02-10T10:30:00.000Z',
          note: 'Balik kampung trip'
        },
        {
          mileage: 43000,
          recordedAt: '2026-01-05T08:00:00.000Z',
          note: 'Engine oil service completed'
        }
      ]
    }
  });

  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@example.com',
      password,
      role: 'admin'
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
        ...twentyFourHourAvailability,
        description: 'General repairs, diagnostics, and periodic maintenance.',
        services: JSON.stringify(['General Repairs', 'Diagnostics', 'Major Service']),
        images: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200'
      },
      {
        name: 'Genting Klang Tyre & Alignment',
        address: 'Taman Danau Kota, Setapak, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.1968,
        longitude: 101.7282,
        phone: '+60-3-4141-2102',
        ...twentyFourHourAvailability,
        description: 'Tyre replacement, wheel balancing, and alignment services.',
        services: JSON.stringify(['Tyre Change']),
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
        services: JSON.stringify(['Engine Tuning', 'General Repairs']),
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
        services: JSON.stringify(['Brake Service', 'Battery Service']),
        images: 'https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?q=80&w=1200'
      },
      {
        name: 'Gombak Rapid Workshop',
        address: 'Jalan Gombak, Batu 4, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.2162,
        longitude: 101.7245,
        phone: '+60-3-4141-2105',
        ...twentyFourHourAvailability,
        description: 'Fast servicing, aircond maintenance, and diagnostics.',
        services: JSON.stringify(['Major Service', 'Aircond Service', 'Diagnostics']),
        images: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200'
      },
      {
        name: 'KL North Auto Diagnostics',
        address: 'Taman Melati, Setapak, Kuala Lumpur',
        city: 'Kuala Lumpur',
        latitude: 3.2223,
        longitude: 101.7357,
        phone: '+60-3-4141-2106',
        ...twentyFourHourAvailability,
        description: 'Computer diagnostics, fuel system service, and oil change.',
        services: JSON.stringify(['Diagnostics', 'Oil Change']),
        images: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=1200'
      },
      {
        name: 'Euro Technik Cheras',
        address: 'No. 18, Jalan Cheras Hartamas 1, Batu 9 Cheras, 43200 Cheras, Selangor',
        city: 'Cheras',
        latitude: 3.0725,
        longitude: 101.7712,
        phone: '+60-3-9107-4421',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'European car specialist focusing on BMW, Mercedes-Benz, and Audi diagnostics and major servicing.',
        services: JSON.stringify(['Diagnostics', 'Major Service', 'Brake Overhaul', 'Engine Repair']),
        images: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?q=80&w=1200'
      },
      {
        name: 'Bavarian Auto Works Cheras',
        address: 'No. 32, Jalan 4/93, Taman Miharja, 55200 Cheras, Kuala Lumpur',
        city: 'Cheras',
        latitude: 3.1284,
        longitude: 101.7276,
        phone: '+60-3-9200-8821',
        opensAt: '09:00',
        closesAt: '18:30',
        description: 'Independent BMW and MINI specialist providing engine overhaul, gearbox repair and ECU coding.',
        services: JSON.stringify(['BMW Specialist', 'ECU Coding', 'Gearbox Repair', 'Performance Upgrade']),
        images: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200'
      },
      {
        name: 'Stuttgart Auto Care',
        address: 'No. 12, Jalan Midah 1, Taman Midah, 56000 Cheras, Kuala Lumpur',
        city: 'Cheras',
        latitude: 3.0903,
        longitude: 101.7385,
        phone: '+60-3-9133-5542',
        opensAt: '09:30',
        closesAt: '18:00',
        description: 'Mercedes-Benz and Porsche specialist with advanced diagnostics and transmission repair services.',
        services: JSON.stringify(['Mercedes Specialist', 'Transmission Repair', 'Diagnostics', 'Major Service']),
        images: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200'
      },
      {
        name: 'VAG Garage Batu 11',
        address: 'No. 7, Jalan 11/118B, Desa Tun Razak, 56000 Cheras, Kuala Lumpur',
        city: 'Cheras',
        latitude: 3.0836,
        longitude: 101.7574,
        phone: '+60-3-9172-6630',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Volkswagen and Audi specialist offering DSG servicing, carbon cleaning and electronic troubleshooting.',
        services: JSON.stringify(['VW Specialist', 'Audi Specialist', 'DSG Service', 'Carbon Cleaning']),
        images: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200'
      },
      {
        name: 'Continental Performance Hub Cheras',
        address: 'No. 21, Jalan CJ 1/6, Taman Connaught, 56000 Cheras, Kuala Lumpur',
        city: 'Cheras',
        latitude: 3.0849,
        longitude: 101.7407,
        phone: '+60-3-9082-7714',
        opensAt: '08:30',
        closesAt: '18:00',
        description: 'Specialist in Volvo, Peugeot, Renault and other continental marques. Preventive maintenance and suspension tuning available.',
        services: JSON.stringify(['Volvo Specialist', 'Peugeot Specialist', 'Suspension Service', 'Aircond Service']),
        images: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?q=80&w=1200'
      },
      {
        name: 'German Autohaus Cheras Selatan',
        address: 'No. 5, Jalan Cheras Selatan 3/12, 43200 Cheras, Selangor',
        city: 'Cheras',
        latitude: 3.0482,
        longitude: 101.7871,
        phone: '+60-3-9075-9921',
        opensAt: '09:00',
        closesAt: '17:30',
        description: 'European car repair centre handling engine rebuilds, electrical diagnostics and scheduled maintenance.',
        services: JSON.stringify(['Engine Rebuild', 'Electrical Diagnostics', 'Scheduled Service', 'Brake Service']),
        images: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1200'
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
        services: JSON.stringify(['General Repairs', 'Brake Service', 'Aircond Service']),
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
        services: JSON.stringify(['Tyre Change', 'Battery Service']),
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
        services: JSON.stringify(['Diagnostics', 'Engine Tuning']),
        images: 'https://images.unsplash.com/photo-1542362567-b07e54358753?q=80&w=1200'
      },
      {
        name: 'Bavarian Auto Garage',
        address: 'No. 8, Jalan Astaka U8/82, Bukit Jelutong, 40150 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.1275,
        longitude: 101.5183,
        phone: '+60-3-7845-9211',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'BMW and MINI specialist workshop offering engine diagnostics, gearbox repair, and performance upgrades.',
        services: JSON.stringify(['BMW Specialist', 'Diagnostics', 'Gearbox Repair', 'Performance Upgrade']),
        images: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=1200'
      },
      {
        name: 'Stuttgart Performance Auto',
        address: 'No. 21, Jalan Penguasa A U1/53A, Hicom Glenmarie Industrial Park, 40150 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.0942,
        longitude: 101.5541,
        phone: '+60-3-5569-4412',
        opensAt: '09:00',
        closesAt: '18:30',
        description: 'Mercedes-Benz and Porsche specialist with advanced diagnostic tools and ECU programming support.',
        services: JSON.stringify(['Mercedes Specialist', 'Porsche Specialist', 'ECU Programming', 'Major Service']),
        images: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1200'
      },
      {
        name: 'VAG Technic Shah Alam',
        address: 'No. 5, Jalan Pahat U1/16, Seksyen U1, 40150 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.1056,
        longitude: 101.5367,
        phone: '+60-3-7846-7710',
        opensAt: '09:30',
        closesAt: '18:00',
        description: 'Volkswagen and Audi repair centre providing DSG service, carbon cleaning, and electronic diagnostics.',
        services: JSON.stringify(['VW Specialist', 'Audi Specialist', 'DSG Service', 'Carbon Cleaning']),
        images: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200'
      },
      {
        name: 'Continental Car Care Glenmarie',
        address: 'No. 18, Jalan Jurunilai U1/20, Glenmarie Industrial Park, 40150 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.0978,
        longitude: 101.5529,
        phone: '+60-3-5569-8320',
        opensAt: '08:30',
        closesAt: '18:00',
        description: 'European car specialist workshop handling Volvo, Peugeot, Renault and other continental brands.',
        services: JSON.stringify(['Volvo Specialist', 'Peugeot Specialist', 'Aircond Service', 'Brake Overhaul']),
        images: 'https://images.unsplash.com/photo-1525609004556-c46c7d6cf023?q=80&w=1200'
      },
      {
        name: 'German Autohaus Seksyen 15',
        address: 'No. 3, Jalan Anggerik Mokara 31/44, Seksyen 31, 40460 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.0332,
        longitude: 101.5360,
        phone: '+60-3-5123-1188',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Specialised in BMW, Mercedes and Volkswagen with full engine rebuild and transmission repair services.',
        services: JSON.stringify(['Transmission Repair', 'Engine Rebuild', 'Major Service', 'Computer Diagnostics']),
        images: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?q=80&w=1200'
      },
      {
        name: 'Auto Bavaria Specialist Hub',
        address: 'No. 27, Jalan Sungai Buloh 27/101A, Seksyen 27, 40400 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.0587,
        longitude: 101.5342,
        phone: '+60-3-5192-9921',
        opensAt: '09:00',
        closesAt: '17:30',
        description: 'Independent European car workshop focusing on scheduled servicing, suspension upgrades and performance tuning.',
        services: JSON.stringify(['Scheduled Service', 'Suspension Upgrade', 'Performance Tuning', 'Diagnostics']),
        images: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?q=80&w=1200'
      },
      {
        name: 'Continental Auto Clinic PJ',
        address: 'No. 28, Jalan SS 22/23, Damansara Jaya, 47400 Petaling Jaya, Selangor',
        city: 'Petaling Jaya',
        latitude: 3.1265,
        longitude: 101.6168,
        phone: '+60-3-7726-2001',
        opensAt: '08:30',
        closesAt: '18:00',
        description: 'Authorised continental car servicing for Volkswagen, Skoda, and SEAT. Specialises in DSG gearbox servicing, timing belt replacements, and ECU remapping.',
        services: JSON.stringify(['Major Service', 'Diagnostics', 'Engine Tuning', 'Oil Change']),
        images: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=1200'
      },
      {
        name: 'Bavarian Masters Subang',
        address: 'No. 5, Jalan USJ 9/5T, USJ 9, 47620 Subang Jaya, Selangor',
        city: 'Subang Jaya',
        latitude: 3.0467,
        longitude: 101.5857,
        phone: '+60-3-8024-3001',
        opensAt: '09:00',
        closesAt: '18:30',
        description: 'BMW and MINI specialist workshop. Services include N-series engine rebuilds, suspension overhaul, brake performance upgrades, and genuine parts supply.',
        services: JSON.stringify(['General Repairs', 'Brake Service', 'Engine Tuning', 'Diagnostics']),
        images: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=1200'
      },
      {
        name: 'Volvo & Scandi Auto Puchong',
        address: 'No. 18, Jalan Puchong Putra 1/2, Bandar Puchong Putra, 47100 Puchong, Selangor',
        city: 'Puchong',
        latitude: 3.0224,
        longitude: 101.6278,
        phone: '+60-3-8076-4001',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Dedicated Volvo, Peugeot, and Citroën service centre. Expert in TPMS, automatic transmission service, and full climate system overhaul.',
        services: JSON.stringify(['Major Service', 'Diagnostics', 'Aircond Service', 'Brake Service']),
        images: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?q=80&w=1200'
      },
      {
        name: 'Merx Euro Workshop Klang',
        address: 'No. 33, Lorong Batu Nilam 3A, Bandar Bukit Tinggi, 41200 Klang, Selangor',
        city: 'Klang',
        latitude: 3.0501,
        longitude: 101.4589,
        phone: '+60-3-3323-5001',
        opensAt: '08:30',
        closesAt: '17:30',
        description: 'Mercedes-Benz and Porsche specialist in Klang Valley. Star diagnostic system, air suspension calibration, and AMG performance tuning.',
        services: JSON.stringify(['Diagnostics', 'Engine Tuning', 'Major Service', 'General Repairs']),
        images: 'https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=1200'
      },
      {
        name: 'Ara Euro Tech Damansara',
        address: 'No. 7, Jalan PJU 1A/41B, Ara Damansara, 47301 Petaling Jaya, Selangor',
        city: 'Petaling Jaya',
        latitude: 3.1198,
        longitude: 101.5744,
        phone: '+60-3-7845-6001',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Audi and Volkswagen authorised independent workshop. Expertise in HALDEX AWD servicing, carbon intake cleaning, and VCDS diagnostics.',
        services: JSON.stringify(['Diagnostics', 'Major Service', 'Engine Tuning', 'Oil Change']),
        images: 'https://images.unsplash.com/photo-1599256872237-5dcc0fbe9668?q=80&w=1200'
      },
      {
        name: 'Glenmarie Continental Centre',
        address: 'No. 14, Jalan Pelabuhan Utama, Glenmarie, 40150 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.0876,
        longitude: 101.5638,
        phone: '+60-3-5569-7001',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Multi-brand European car workshop serving the Glenmarie industrial area. Specialises in pre-purchase inspections, transmission rebuilds, and full electrical diagnostics.',
        services: JSON.stringify(['Diagnostics', 'General Repairs', 'Major Service', 'Battery Service']),
        images: 'https://images.unsplash.com/photo-1625047509248-ec889cbff17f?q=80&w=1200'
      },
      {
        name: 'Setia Alam Euro Motors',
        address: 'No. 22, Persiaran Setia Aman, Setia Alam, 40170 Shah Alam, Selangor',
        city: 'Shah Alam',
        latitude: 3.1136,
        longitude: 101.4613,
        phone: '+60-3-3358-8001',
        opensAt: '09:00',
        closesAt: '18:30',
        description: 'European car service specialist covering BMW, Volvo, and Land Rover. Offers wheel alignment, tyre balancing, and complete drivetrain servicing.',
        services: JSON.stringify(['Major Service', 'Tyre Change', 'Brake Service', 'Diagnostics']),
        images: 'https://images.unsplash.com/photo-1498889444388-e67ea62c464b?q=80&w=1200'
      },
      {
        name: 'Nilai Euro Service Centre',
        address: 'No. 9, Jalan Impian Emas 5/2, Taman Impian Emas, 71800 Nilai, Selangor',
        city: 'Nilai',
        latitude: 2.8143,
        longitude: 101.7980,
        phone: '+60-6-799-9001',
        opensAt: '09:00',
        closesAt: '18:00',
        description: 'Serving the Nilai corridor with European car maintenance for Mercedes, BMW, and Peugeot. Includes oil service, spark plug replacement, and air filter servicing.',
        services: JSON.stringify(['Major Service', 'Oil Change', 'General Repairs', 'Diagnostics']),
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
