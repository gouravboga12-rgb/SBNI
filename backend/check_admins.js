const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const admins = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' }
  });
  console.log('ADMIN USERS IN RDS:', admins.map(a => ({ id: a.id, email: a.email, name: a.name, role: a.role })));
}

main().finally(() => prisma.$disconnect());
