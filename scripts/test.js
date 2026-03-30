const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
db.user.findMany().then(u => {
  console.log(JSON.stringify(u.map(x => ({ role: x.role, phone: x.phone })), null, 2));
  db.$disconnect();
});
