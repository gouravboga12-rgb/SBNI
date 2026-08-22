const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const leads = await prisma.financingLead.findMany({});
  for (const l of leads) {
    console.log('--- LEAD ---');
    console.log('id:', l.id);
    console.log('lenderId:', l.lenderId);
    console.log('type:', l.type);
    console.log('status:', l.status);
    console.log('vendorId:', l.vendorId);
  }
}
main().finally(() => prisma.$disconnect());
