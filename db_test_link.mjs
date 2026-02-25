import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    await prisma.moduleItem.update({
        where: { id: 'cmm29q2nu0003o2hpjxiioh1e' },
        data: { assignmentId: 'cmm29q0fr0000o2hpf3ogulqd' }
    })
    console.log("Successfully linked item to assignment.")
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
