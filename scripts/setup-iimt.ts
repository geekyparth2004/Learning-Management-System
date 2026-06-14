import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log("Setting up IIMT University...");

  // 1. Create or get Organization
  const org = await prisma.organization.upsert({
      where: { domain: "iimtindia.net" },
      update: { name: "IIMT University" },
      create: {
          name: "IIMT University",
          domain: "iimtindia.net"
      }
  });
  console.log("Organization created/found:", org.id, org.name);

  // 2. Create or get TPO
  const hashedPassword = await bcrypt.hash("iimt@1506", 10);
  const email = "abhishek4997_gn@iimtindia.net";
  
  const user = await prisma.user.upsert({
      where: { email: email },
      update: {
          password: hashedPassword,
          role: "COORDINATOR",
          organizationId: org.id,
          name: "Abhishek (TPO)"
      },
      create: {
          email: email,
          name: "Abhishek (TPO)",
          password: hashedPassword,
          role: "COORDINATOR",
          organizationId: org.id
      }
  });
  console.log("TPO created/updated:", user.email);

  // 3. Update all students with @iimtindia in their email
  const updateResult = await prisma.user.updateMany({
      where: {
          email: {
              contains: "@iimtindia"
          },
          id: {
              not: user.id
          }
      },
      data: {
          organizationId: org.id
      }
  });
  
  console.log(`Updated ${updateResult.count} students with @iimtindia email to belong to IIMT University.`);
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
