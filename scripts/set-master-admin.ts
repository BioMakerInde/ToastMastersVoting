// Script to set a user as master admin
// Usage: npx ts-node scripts/set-master-admin.ts <email>

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setMasterAdmin() {
    const email = process.argv[2];

    if (!email) {
        console.log('Usage: npx ts-node scripts/set-master-admin.ts <email>');
        console.log('Example: npx ts-node scripts/set-master-admin.ts admin@example.com');
        process.exit(1);
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            console.error(`User with email "${email}" not found`);
            process.exit(1);
        }

        await prisma.user.update({
            where: { email },
            data: { isMasterAdmin: true }
        });

        console.log(`✅ Successfully set "${user.name}" (${email}) as Master Admin`);
        console.log('\nThey can now access: /master-admin');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setMasterAdmin();
