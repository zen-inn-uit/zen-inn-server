import { PrismaClient, Role, Provider, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = '23520434@gm.uit.edu.vn';
  const password = 'Admin123!';

  const hash = await argon2.hash(password);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},   // không sửa gì nếu admin đã tồn tại
    create: {
      email,
      passwordHash: hash,
      role: Role.ADMIN,
      provider: Provider.PASSWORD,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✔ Admin user created/exists:', admin.email);
  console.log('✔ Login with:');
  console.log('   email:', email);
  console.log('   password:', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
