const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, phone: true, role: true, vendorProfile: true, lenderProfile: true }
  });
  console.log('=== USERS ===');
  console.log(JSON.stringify(users, null, 2));

  const leads = await prisma.financingLead.findMany({
    include: { lender: true }
  });
  console.log('=== FINANCING LEADS ===');
  console.log(JSON.stringify(leads, null, 2));
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
