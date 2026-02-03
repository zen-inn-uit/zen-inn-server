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

  // 2.1 Create Partner User 2
  const partnerEmail2 = 'partner2@zeninn.com';
  const partnerHash2 = await argon2.hash('Partner123!');

  const partnerUser2 = await prisma.user.upsert({
    where: { email: partnerEmail2 },
    update: {},
    create: {
      email: partnerEmail2,
      passwordHash: partnerHash2,
      role: Role.PARTNER,
      provider: Provider.PASSWORD,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      fullName: 'Zen Inn Partner 2',
      phoneNumber: '+84907654321',
    },
  });

  console.log('✔ Partner user 2 created/exists:', partnerUser2.email);

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

  // 3.1 Create Partner Profile 2
  const partner2 = await prisma.partner.upsert({
    where: { userId: partnerUser2.id },
    update: {},
    create: {
      userId: partnerUser2.id,
      company: 'Highlands Hotel Management',
      kycStatus: KycStatus.APPROVED,
    },
  });

  console.log('✔ Partner profile 2 created/exists');

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
      city: 'Đà Lạt',
      country: 'Vietnam',
      address: '15 Trần Phú, Đà Lạt',
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
    {
      name: 'Dalat Flower Garden Hotel',
      city: 'Đà Lạt',
      country: 'Vietnam',
      address: '88 Hoàng Văn Thụ, Đà Lạt',
      description: 'Charming boutique hotel surrounded by beautiful flower gardens in the heart of Dalat.',
      starRating: 3,
      phone: '+84263789012',
      images: [
        'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      ],
      rooms: [
        {
          name: 'Garden View Room',
          roomType: 'Standard',
          capacity: 2,
          totalCount: 20,
          availableCount: 15,
          area: 24,
          description: 'Cozy room overlooking colorful flower gardens',
          beds: [{ bedType: BedType.DOUBLE, quantity: 1 }],
          basePrice: 550000,
          images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
          ],
        },
        {
          name: 'Deluxe Twin Garden',
          roomType: 'Deluxe',
          capacity: 2,
          totalCount: 10,
          availableCount: 7,
          area: 28,
          description: 'Spacious room with twin beds and garden terrace',
          beds: [{ bedType: BedType.TWIN, quantity: 2 }],
          basePrice: 750000,
          images: [
            'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800',
          ],
        },
      ],
    },
    {
      name: 'Dalat Lake View Resort',
      city: 'Đà Lạt',
      country: 'Vietnam',
      address: '22 Yersin, Hồ Xuân Hương, Đà Lạt',
      description: 'Luxurious resort with stunning views of Xuan Huong Lake and surrounding pine hills.',
      starRating: 5,
      phone: '+84263567890',
      images: [
        'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      ],
      rooms: [
        {
          name: 'Premium Lake View',
          roomType: 'Deluxe',
          capacity: 2,
          totalCount: 16,
          availableCount: 12,
          area: 38,
          description: 'Elegant room with panoramic lake views and balcony',
          beds: [{ bedType: BedType.KING, quantity: 1 }],
          basePrice: 1950000,
          images: [
            'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
          ],
        },
        {
          name: 'Presidential Suite',
          roomType: 'Suite',
          capacity: 4,
          totalCount: 3,
          availableCount: 2,
          area: 75,
          description: 'Luxurious suite with separate living room, dining area, and lake view terrace',
          beds: [{ bedType: BedType.KING, quantity: 1 }, { bedType: BedType.QUEEN, quantity: 1 }],
          basePrice: 3500000,
          images: [
            'https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800',
          ],
        },
      ],
    },
    {
      name: 'Dalat Valley Hotel',
      city: 'Đà Lạt',
      country: 'Vietnam',
      address: '45 Phan Đình Phùng, Đà Lạt',
      description: 'Budget-friendly hotel with clean rooms and friendly service, perfect for backpackers.',
      starRating: 2,
      phone: '+84263345678',
      images: [
        'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800',
      ],
      rooms: [
        {
          name: 'Economy Twin',
          roomType: 'Economy',
          capacity: 2,
          totalCount: 25,
          availableCount: 18,
          area: 18,
          description: 'Simple and clean room with basic amenities',
          beds: [{ bedType: BedType.TWIN, quantity: 2 }],
          basePrice: 350000,
          images: [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
          ],
        },
        {
          name: 'Budget Family Room',
          roomType: 'Family',
          capacity: 4,
          totalCount: 8,
          availableCount: 5,
          area: 30,
          description: 'Affordable family room with bunk beds',
          beds: [{ bedType: BedType.DOUBLE, quantity: 1 }, { bedType: BedType.SINGLE, quantity: 2 }],
          basePrice: 500000,
          images: [
            'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800',
          ],
        },
      ],
    },
    {
      name: 'Dalat Pine Hills Villa',
      city: 'Đà Lạt',
      country: 'Vietnam',
      address: '8 Khe Sanh, Phường 10, Đà Lạt',
      description: 'Exclusive hillside villas offering privacy, luxury and breathtaking mountain views.',
      starRating: 5,
      phone: '+84263901234',
      images: [
        'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800',
        'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800',
      ],
      rooms: [
        {
          name: 'Private Villa with Pool',
          roomType: 'Villa',
          capacity: 4,
          totalCount: 6,
          availableCount: 4,
          area: 85,
          description: 'Luxury villa with private infinity pool and mountain views',
          beds: [{ bedType: BedType.KING, quantity: 2 }],
          basePrice: 4200000,
          images: [
            'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
          ],
        },
        {
          name: 'Garden Villa',
          roomType: 'Villa',
          capacity: 3,
          totalCount: 8,
          availableCount: 6,
          area: 60,
          description: 'Elegant villa with private garden and outdoor seating',
          beds: [{ bedType: BedType.KING, quantity: 1 }, { bedType: BedType.SINGLE, quantity: 1 }],
          basePrice: 2800000,
          images: [
            'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800',
          ],
        },
      ],
    },
    {
      name: 'Dalat Cozy Inn',
      city: 'Đà Lạt',
      country: 'Vietnam',
      address: '67 Bùi Thị Xuân, Đà Lạt',
      description: 'Small family-run inn with warm hospitality and homemade breakfast.',
      starRating: 3,
      phone: '+84263456789',
      images: [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
      ],
      rooms: [
        {
          name: 'Cozy Double',
          roomType: 'Standard',
          capacity: 2,
          totalCount: 12,
          availableCount: 9,
          area: 22,
          description: 'Warm and comfortable room with home-like atmosphere',
          beds: [{ bedType: BedType.DOUBLE, quantity: 1 }],
          basePrice: 480000,
          images: [
            'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800',
          ],
        },
        {
          name: 'Triple Room',
          roomType: 'Triple',
          capacity: 3,
          totalCount: 6,
          availableCount: 4,
          area: 28,
          description: 'Spacious room for small groups or families',
          beds: [{ bedType: BedType.SINGLE, quantity: 3 }],
          basePrice: 650000,
          images: [
            'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800',
          ],
        },
      ],
    },
  ];

  for (const hotelData of hotelsData) {
    const { rooms: roomsData, images: hotelImages, ...hotelInfo } = hotelData;

    // Generate unique ID from hotel name
    const hotelId = `hotel-${hotelInfo.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;
    
    // Generate slug from hotel name (remove Vietnamese accents for better URLs)
    const slug = hotelInfo.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .toLowerCase()
      .replace(/đ/g, 'd') // Replace đ with d
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .trim();

    try {
      const hotel = await prisma.hotel.upsert({
        where: { id: hotelId },
        update: {},
        create: {
          id: hotelId,
          ...hotelInfo,
          slug,
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

        // Create inventory for next 60 days
        const today = new Date();
        for (let i = 0; i < 60; i++) {
          const inventoryDate = new Date(today);
          inventoryDate.setDate(today.getDate() + i);
          
          await prisma.roomInventory.upsert({
            where: {
              roomId_date: {
                roomId: room.id,
                date: inventoryDate,
              },
            },
            update: {},
            create: {
              roomId: room.id,
              date: inventoryDate,
              available: roomData.availableCount,
              price: basePrice,
              isStopSell: false,
            },
          });
        }

        console.log(`    ✔ Inventory created for ${room.name} (60 days)`);
      }
    } catch (error: any) {
      console.log(`⚠️  Skipping hotel ${hotelInfo.name}: ${error.message}`);
      continue;
    }
  }

  console.log('\n✅ Database seeding completed successfully!');
  console.log('\n📋 Login credentials:');
  console.log('   Admin - email:', email, '| password:', password);
  console.log('   Partner 1 - email:', partnerEmail, '| password: Partner123!');
  console.log('   Partner 2 - email:', partnerEmail2, '| password: Partner123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
