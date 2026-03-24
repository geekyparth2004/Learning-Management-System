import { PrismaClient } from './node_modules/@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient()

async function main() {
  const trialUsers = await prisma.user.findMany({
    where: {
      subscriptionStatus: "TRIAL",
    },
    select: {
      id: true,
      name: true,
      email: true,
      lastActivityDate: true,
      trialExpiresAt: true,
    }
  })

  // Start of Day in IST (UTC+5:30) is basically 00:00:00 IST -> 18:30:00 UTC previous day
  // But strictly today for IST (March 24th) is after 2026-03-23T18:30:00.000Z
  const startOfDay = new Date('2026-03-23T18:30:00.000Z');
  const todayTrialUsers = trialUsers.filter(u => u.lastActivityDate && new Date(u.lastActivityDate) >= startOfDay);

  fs.writeFileSync('trial_users.json', JSON.stringify({
    all: trialUsers,
    today: todayTrialUsers
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
