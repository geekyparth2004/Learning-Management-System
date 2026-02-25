import { PrismaClient } from '@prisma/client'
import fs from 'fs'
const prisma = new PrismaClient()

async function main() {
    const assignments = await prisma.assignment.findMany({
        where: { title: 'HTML Forms Assignment' },
        orderBy: { createdAt: 'desc' }
    })
    fs.writeFileSync('out_assignments.json', JSON.stringify(assignments, null, 2))
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
