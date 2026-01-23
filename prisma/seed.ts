import { 
  PrismaClient, 
  Role, 
  Provider, 
  UserStatus, 
  KycStatus, 
  HotelStatus,
  AmenityCategory,
  BedType
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // 1. Create Admin User
  const email = '23520434@gm.uit.edu.vn';
  const password = 'Admin123!';
  const hash = await argon2.hash(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hash,
      role: Role.ADMIN,
      provider: Provider.PASSWORD,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      fullName: 'Admin User',
    },
  });

  console.log('✔ Admin user created/exists:', admin.email);

  // 2. Create Partner Users
  const partnerEmail = 'partner@zeninn.com';
  const partnerHash = await argon2.hash('Partner123!');

  const partnerUser = await prisma.user.upsert({
    where: { email: partnerEmail },
    update: {},
    create: {
      email: partnerEmail,
      passwordHash: partnerHash,
      role: Role.PARTNER,
      provider: Provider.PASSWORD,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      fullName: 'Zen Inn Partner',
      phoneNumber: '+84901234567',
    },
  });

  console.log('✔ Partner user created/exists:', partnerUser.email);

  // 3. Create Partner Profile
  const partner = await prisma.partner.upsert({
    where: { userId: partnerUser.id },
    update: {},
    create: {
      userId: partnerUser.id,
      company: 'Zen Inn Hotels Group',
      kycStatus: KycStatus.APPROVED,
    },
  });

  console.log('✔ Partner profile created/exists');

  // 4. Create Amenities
  const amenitiesData = [
    { name: 'WiFi', category: AmenityCategory.ROOM_FEATURE, icon: '📶' },
    { name: 'Air Conditioning', category: AmenityCategory.ROOM_FEATURE, icon: '❄️' },
    { name: 'TV', category: AmenityCategory.ENTERTAINMENT, icon: '📺' },
    { name: 'Mini Bar', category: AmenityCategory.CONVENIENCE, icon: '🍷' },
    { name: 'Safe', category: AmenityCategory.SAFETY, icon: '🔒' },
    { name: 'Shower', category: AmenityCategory.BATHROOM, icon: '🚿' },
    { name: 'Bathtub', category: AmenityCategory.BATHROOM, icon: '🛁' },
    { name: 'Hair Dryer', category: AmenityCategory.BATHROOM, icon: '💨' },
  ];

  const amenities: any[] = [];
  for (const amenityData of amenitiesData) {
    const amenity = await prisma.amenity.upsert({
      where: { name: amenityData.name },
      update: {},
      create: amenityData,
    });
    amenities.push(amenity);
  }

  console.log(`✔ ${amenities.length} amenities created/exists`);

  // 5. Create Hotels with Rooms
  const hotelsData = [
    {
      name: 'Zen Inn Saigon Central',
      city: 'Ho Chi Minh City',
      country: 'Vietnam',
      address: '123 Nguyen Hue Street, District 1',
      description: 'A luxurious hotel in the heart of Saigon with stunning city views and world-class amenities.',
      starRating: 5,
      phone: '+84283823456',
      images: [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
        'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      ],
      rooms: [
        {
          name: 'Deluxe King Room',
          roomType: 'Deluxe',
          capacity: 2,
          totalCount: 10,
          availableCount: 8,
          area: 35,
          description: 'Spacious room with king-size bed and city view',
          beds: [{ bedType: BedType.KING, quantity: 1 }],
          basePrice: 1200000,
          images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
          ],
        },
        {
          name: 'Superior Twin Room',
          roomType: 'Superior',
          capacity: 2,
          totalCount: 15,
          availableCount: 12,
          area: 30,
          description: 'Comfortable room with two single beds',
          beds: [{ bedType: BedType.TWIN, quantity: 2 }],
          basePrice: 900000,
          images: [
            'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
          ],
        },
      ],
    },
    {
      name: 'Zen Inn Hanoi Old Quarter',
      city: 'Hanoi',
      country: 'Vietnam',
      address: '45 Hang Bong Street, Hoan Kiem District',
      description: 'Charming boutique hotel located in the historic Old Quarter, perfect for exploring Hanoi.',
      starRating: 4,
      phone: '+84243826789',
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      ],
      rooms: [
        {
          name: 'Classic Double Room',
          roomType: 'Classic',
          capacity: 2,
          totalCount: 12,
          availableCount: 10,
          area: 25,
          description: 'Cozy room with double bed and traditional Vietnamese decor',
          beds: [{ bedType: BedType.DOUBLE, quantity: 1 }],
          basePrice: 700000,
          images: [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
          ],
        },
        {
          name: 'Family Suite',
          roomType: 'Suite',
          capacity: 4,
          totalCount: 5,
          availableCount: 3,
          area: 50,
          description: 'Spacious suite perfect for families',
          beds: [
            { bedType: BedType.QUEEN, quantity: 1 },
            { bedType: BedType.SINGLE, quantity: 2 },
          ],
          basePrice: 1500000,
          images: [
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
          ],
        },
      ],
    },
    {
      name: 'Zen Inn Da Nang Beach Resort',
      city: 'Da Nang',
      country: 'Vietnam',
      address: '789 Vo Nguyen Giap Street, Son Tra District',
      description: 'Beachfront resort with stunning ocean views and direct beach access.',
      starRating: 5,
      phone: '+84236123456',
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      ],
      rooms: [
        {
          name: 'Ocean View King Room',
          roomType: 'Deluxe',
          capacity: 2,
          totalCount: 20,
          availableCount: 15,
          area: 40,
          description: 'Luxurious room with panoramic ocean views',
          beds: [{ bedType: BedType.KING, quantity: 1 }],
          basePrice: 1800000,
          images: [
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
          ],
        },
      ],
    },
    {
      name: 'Zen Inn Phu Quoc Paradise',
      city: 'Phu Quoc',
      country: 'Vietnam',
      address: '56 Tran Hung Dao Street, Duong Dong',
      description: 'Tropical paradise resort on the beautiful island of Phu Quoc with private beach access.',
      starRating: 5,
      phone: '+84297123456',
      images: [
        'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
      ],
      rooms: [
        {
          name: 'Beach Villa',
          roomType: 'Villa',
          capacity: 3,
          totalCount: 8,
          availableCount: 5,
          area: 60,
          description: 'Luxurious beachfront villa with private pool',
          beds: [{ bedType: BedType.KING, quantity: 1 }, { bedType: BedType.SINGLE, quantity: 1 }],
          basePrice: 2500000,
          images: [
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
          ],
        },
        {
          name: 'Garden Bungalow',
          roomType: 'Bungalow',
          capacity: 2,
          totalCount: 12,
          availableCount: 8,
          area: 35,
          description: 'Cozy bungalow surrounded by tropical gardens',
          beds: [{ bedType: BedType.QUEEN, quantity: 1 }],
          basePrice: 1400000,
          images: [
            'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
          ],
        },
      ],
    },
    {
      name: 'Zen Inn Sapa Mountain View',
      city: 'Sapa',
      country: 'Vietnam',
      address: '12 Cau May Street, Sapa',
      description: 'Mountain retreat with breathtaking views of rice terraces and misty peaks.',
      starRating: 4,
      phone: '+84214123456',
      images: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      ],
      rooms: [
        {
          name: 'Mountain View Double',
          roomType: 'Standard',
          capacity: 2,
          totalCount: 15,
          availableCount: 12,
          area: 28,
          description: 'Comfortable room with stunning mountain views',
          beds: [{ bedType: BedType.DOUBLE, quantity: 1 }],
          basePrice: 800000,
          images: [
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
          ],
        },
        {
          name: 'Terrace Suite',
          roomType: 'Suite',
          capacity: 3,
          totalCount: 6,
          availableCount: 4,
          area: 45,
          description: 'Spacious suite with private terrace overlooking rice terraces',
          beds: [{ bedType: BedType.KING, quantity: 1 }, { bedType: BedType.SINGLE, quantity: 1 }],
          basePrice: 1600000,
          images: [
            'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=800',
          ],
        },
      ],
    },
    {
      name: 'Zen Inn Hoi An Riverside',
      city: 'Hoi An',
      country: 'Vietnam',
      address: '88 Bach Dang Street, Hoi An Ancient Town',
      description: 'Charming riverside hotel in the UNESCO World Heritage ancient town of Hoi An.',
      starRating: 4,
      phone: '+84235123456',
      images: [
        'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800',
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
      ],
      rooms: [
        {
          name: 'Heritage Room',
          roomType: 'Classic',
          capacity: 2,
          totalCount: 10,
          availableCount: 7,
          area: 30,
          description: 'Traditional Vietnamese style room with modern amenities',
          beds: [{ bedType: BedType.QUEEN, quantity: 1 }],
          basePrice: 950000,
          images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
          ],
        },
        {
          name: 'Riverside Balcony Room',
          roomType: 'Deluxe',
          capacity: 2,
          totalCount: 8,
          availableCount: 5,
          area: 35,
          description: 'Room with private balcony overlooking the Thu Bon River',
          beds: [{ bedType: BedType.KING, quantity: 1 }],
          basePrice: 1300000,
          images: [
            'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
          ],
        },
      ],
    },
    {
      name: 'Zen Inn Nha Trang Bay',
      city: 'Nha Trang',
      country: 'Vietnam',
      address: '234 Tran Phu Street, Nha Trang',
      description: 'Modern beachfront hotel with stunning bay views and easy access to Nha Trang beach.',
      starRating: 5,
      phone: '+84258123456',
      images: [
        'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      ],
      rooms: [
        {
          name: 'Bay View King',
          roomType: 'Deluxe',
          capacity: 2,
          totalCount: 18,
          availableCount: 14,
          area: 38,
          description: 'Elegant room with panoramic bay views',
          beds: [{ bedType: BedType.KING, quantity: 1 }],
          basePrice: 1650000,
          images: [
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
          ],
        },
        {
          name: 'Executive Suite',
          roomType: 'Suite',
          capacity: 3,
          totalCount: 5,
          availableCount: 3,
          area: 55,
          description: 'Luxurious suite with separate living area and ocean view',
          beds: [{ bedType: BedType.KING, quantity: 1 }, { bedType: BedType.SINGLE, quantity: 1 }],
          basePrice: 2200000,
          images: [
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
          ],
        },
      ],
    },
    {
      name: 'Zen Inn Dalat Highlands',
      city: 'Dalat',
      country: 'Vietnam',
      address: '15 Tran Phu Street, Dalat',
      description: 'Cozy highland retreat in the city of eternal spring with pine forest views.',
      starRating: 4,
      phone: '+84263123456',
      images: [
        'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
      ],
      rooms: [
        {
          name: 'Pine Forest View',
          roomType: 'Standard',
          capacity: 2,
          totalCount: 14,
          availableCount: 10,
          area: 26,
          description: 'Comfortable room with views of pine forests',
          beds: [{ bedType: BedType.DOUBLE, quantity: 1 }],
          basePrice: 750000,
          images: [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
          ],
        },
        {
          name: 'Highland Suite',
          roomType: 'Suite',
          capacity: 4,
          totalCount: 4,
          availableCount: 2,
          area: 48,
          description: 'Spacious suite with fireplace and mountain views',
          beds: [{ bedType: BedType.QUEEN, quantity: 2 }],
          basePrice: 1700000,
          images: [
            'https://images.unsplash.com/photo-1631049035182-249067d7618e?w=800',
          ],
        },
      ],
    },
  ];

  for (const hotelData of hotelsData) {
    const { rooms: roomsData, images: hotelImages, ...hotelInfo } = hotelData;

    const hotel = await prisma.hotel.upsert({
      where: { id: `hotel-${hotelInfo.name.toLowerCase().replace(/\s+/g, '-')}` },
      update: {},
      create: {
        ...hotelInfo,
        partnerId: partner.id,
        status: HotelStatus.ACTIVE,
        images: {
          create: hotelImages.map((url, index) => ({
            url,
            displayOrder: index,
          })),
        },
      },
    });

    console.log(`✔ Hotel created: ${hotel.name}`);

    // Create rooms for this hotel
    for (const roomData of roomsData) {
      const { beds: bedsData, images: roomImages, basePrice, ...roomInfo } = roomData;

      const room = await prisma.room.create({
        data: {
          ...roomInfo,
          hotelId: hotel.id,
          images: {
            create: roomImages.map((url, index) => ({
              url,
              displayOrder: index,
            })),
          },
          beds: {
            create: bedsData,
          },
          amenities: {
            create: amenities.slice(0, 5).map(amenity => ({
              amenityId: amenity.id,
            })),
          },
        },
      });

      // Create rate plan for this room
      await prisma.ratePlan.create({
        data: {
          name: 'Standard Rate',
          description: 'Best available rate',
          basePrice,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          partnerId: partner.id,
          hotelId: hotel.id,
          active: true,
          rooms: {
            connect: { id: room.id },
          },
        },
      });

      console.log(`  ✔ Room created: ${room.name}`);
    }
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin - email:', email, '| password:', password);
  console.log('   Partner - email:', partnerEmail, '| password: Partner123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
