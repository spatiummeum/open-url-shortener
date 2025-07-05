"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding database...');
    const hashedPassword = await bcryptjs_1.default.hash('admin123', 12);
    const adminUser = await prisma.user.upsert({
        where: { email: 'admin@urlshortener.com' },
        update: {},
        create: {
            email: 'admin@urlshortener.com',
            password: hashedPassword,
            name: 'Administrator',
            plan: client_1.UserPlan.ENTERPRISE,
            isActive: true,
            isVerified: true,
        },
    });
    console.log('✅ Admin user created:', adminUser.email);
    const testUsers = [
        {
            email: 'user1@test.com',
            name: 'Test User 1',
            plan: client_1.UserPlan.FREE,
        },
        {
            email: 'user2@test.com',
            name: 'Test User 2',
            plan: client_1.UserPlan.PRO,
        },
    ];
    for (const userData of testUsers) {
        const hashedTestPassword = await bcryptjs_1.default.hash('test123', 12);
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
//# sourceMappingURL=seed.js.map