const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();
const search = "";
const where = {
    role: "STUDENT"
};
if (search.trim()) {
    Object.assign(where, {
        OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } }
        ]
    });
}
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
    console.log("Success:", JSON.stringify(res, null, 2));
    db.$disconnect();
}).catch(err => {
    console.log("Error:", err.message);
    db.$disconnect();
});
