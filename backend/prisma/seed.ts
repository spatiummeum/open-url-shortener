import { PrismaClient, UserPlan } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Crear usuario administrador
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@urlshortener.com' },
    update: {},
    create: {
      email: 'admin@urlshortener.com',
      password: hashedPassword,
      name: 'Administrator',
      plan: UserPlan.ENTERPRISE,
      isActive: true,
      isVerified: true,
    },
  });

  console.log('✅ Admin user created:', adminUser.email);

  // Crear algunos usuarios de prueba
  const testUsers = [
    {
      email: 'user1@test.com',
      name: 'Test User 1',
      plan: UserPlan.FREE,
    },
    {
      email: 'user2@test.com',
      name: 'Test User 2',
      plan: UserPlan.PRO,
    },
  ];

  for (const userData of testUsers) {
    const hashedTestPassword = await bcrypt.hash('test123', 12);
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        ...userData,
        password: hashedTestPassword,
        isActive: true,
        isVerified: true,
      },
    });
  }

  console.log('✅ Test users created');

  // Crear algunos dominios de ejemplo
  await prisma.domain.createMany({
    data: [
      {
        domain: 'short.ly',
        userId: adminUser.id,
        isActive: true,
      },
      {
        domain: 'tiny.url',
        userId: adminUser.id,
        isActive: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Example domains created');

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
