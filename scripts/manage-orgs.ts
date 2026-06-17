import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log("Setting up IEC Group of Institutions...");

  // 1. Create or get Organization for IEC
  const org = await prisma.organization.upsert({
      where: { domain: "iec.edu.in" },
      update: { name: "IEC Group of Institutions" },
      create: {
          name: "IEC Group of Institutions",
          domain: "iec.edu.in"
      }
  });
  console.log("Organization created/found:", org.id, org.name);

  // 2. Create or get TPO for IEC
  const hashedPassword = await bcrypt.hash("iec@1706", 10);
  const email = "tpo@iec.edu.in";
  
  const user = await prisma.user.upsert({
      where: { email: email },
      update: {
          password: hashedPassword,
          role: "COORDINATOR",
          organizationId: org.id,
          name: "TPO (IEC)"
      },
      create: {
          email: email,
          name: "TPO (IEC)",
          password: hashedPassword,
          role: "COORDINATOR",
          organizationId: org.id
      }
  });
  console.log("TPO created/updated:", user.email);

  // 3. Update any existing students with @iec.edu.in in their email
  const updateResult = await prisma.user.updateMany({
      where: {
          email: {
              endsWith: "@iec.edu.in"
          },
          id: {
              not: user.id
          }
      },
      data: {
          organizationId: org.id
      }
  });
  
  console.log(`Updated ${updateResult.count} existing students with @iec.edu.in email to belong to IEC Group of Institutions.`);

  // 4. Delete the IIMT Organization
  console.log("Looking for IIMT Organization to delete...");
  const iimtOrg = await prisma.organization.findFirst({
      where: {
          OR: [
              { domain: { contains: "iimt" } },
              { name: { contains: "IIMT" } }
          ]
      }
  });

  if (iimtOrg) {
      console.log(`Found IIMT Organization: ${iimtOrg.name} (${iimtOrg.domain}). Processing deletion...`);

      // Unlink users from IIMT Org
      const unlinkUsers = await prisma.user.updateMany({
          where: { organizationId: iimtOrg.id },
          data: { organizationId: null }
      });
      console.log(`Unlinked ${unlinkUsers.count} users from IIMT Org.`);

      // Also delete the IIMT TPO user since they are no longer needed
      const iimtTpo = await prisma.user.findFirst({
          where: { email: "abhishek4997_gn@iimtindia.net" }
      });
      if (iimtTpo) {
          await prisma.user.delete({ where: { id: iimtTpo.id } });
          console.log(`Deleted IIMT TPO user: ${iimtTpo.email}`);
      }

      // Delete the organization
      await prisma.organization.delete({
          where: { id: iimtOrg.id }
      });
      console.log("Successfully deleted IIMT Organization.");
  } else {
      console.log("IIMT Organization not found.");
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
