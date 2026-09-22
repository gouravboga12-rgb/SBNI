import prisma from './config/prisma';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      phone: true,
      role: true,
      pushToken: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  console.log('--- USERS AND PUSH TOKENS ---');
  users.forEach((u) => {
    console.log(`User ${u.id} (${u.phone}, ${u.role}): pushToken = ${u.pushToken || 'NULL'}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
