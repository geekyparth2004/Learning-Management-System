import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const problems = await prisma.assignment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        include: { problems: true }
    });
    fs.writeFileSync('db_out_2.json', JSON.stringify(problems, null, 2), 'utf8');
}

main().catch(console.error).finally(() => prisma.$disconnect());
