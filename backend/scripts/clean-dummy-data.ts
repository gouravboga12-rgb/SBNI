import prisma from '../src/config/prisma';

async function main() {
  console.log('--- CLEANING DUMMY SEED ACCOUNTS ---');
  const dummyEmails = [
    'contact@capitalgrowthnbfc.com',
    'loans@rajeshfinance.in',
    'rajesh@sharmatextiles.com',
    'rajesh@sharmaindustries.in',
  ];

  for (const email of dummyEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      console.log(`Deleting dummy user [${user.id}]: ${user.email}`);
      // Cascade delete handles lenderProfile, vendorProfile, etc.
      await prisma.user.delete({ where: { id: user.id } });
    }
  }

  // Also clean up any orphaned dummy leads
  const allUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      lenderProfile: true,
      vendorProfile: true,
    },
  });

  console.log('REMAINING REAL USERS IN DATABASE:', JSON.stringify(allUsers, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
