const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const res = await prisma.financingLead.deleteMany({});
  console.log('DELETED LEADS COUNT:', res.count);
}
main().finally(() => prisma.$disconnect());
