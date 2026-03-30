const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const search = "";
const where = {
    role: "STUDENT"
};
db.user.findMany({
    where: where,
    orderBy: { createdAt: "desc" },
    skip: 0,
    take: 10,
    select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        subscriptionStatus: true,
        trialExpiresAt: true
    }
}).then(res => {
    fs.writeFileSync('scripts/out.json', JSON.stringify({success: true}, null, 2));
    db.$disconnect();
}).catch(err => {
    fs.writeFileSync('scripts/out.json', JSON.stringify({error: err.message}, null, 2));
    db.$disconnect();
});
