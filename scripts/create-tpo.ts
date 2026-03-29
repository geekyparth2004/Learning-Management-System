import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const org = await prisma.organization.upsert({
      where: { domain: "college.com" },
      update: {},
      create: {
          name: "The College",
          domain: "college.com"
      }
  });

  const hashedPassword = await bcrypt.hash("parth1234", 10);

  const user = await prisma.user.upsert({
      where: { email: "tpo@college.com" },
      update: {
          password: hashedPassword,
          role: "COORDINATOR",
          organizationId: org.id
      },
      create: {
          email: "tpo@college.com",
          name: "TPO Officer",
          password: hashedPassword,
          role: "COORDINATOR",
          organizationId: org.id
      }
  });
  console.log("SUCCESS:", user.email);
}
main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
