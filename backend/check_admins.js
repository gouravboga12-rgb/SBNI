const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, phone: true, role: true, isVerified: true }
  });
  console.log('=== ALL USERS (' + users.length + ') ===\n', JSON.stringify(users, null, 2));

  const vendors = await prisma.vendorProfile.findMany({
    include: { user: { select: { email: true, phone: true, isVerified: true } } }
  });
  console.log('=== ALL VENDORS (' + vendors.length + ') ===\n', JSON.stringify(vendors, null, 2));

  const lenders = await prisma.lenderProfile.findMany({
    include: { user: { select: { email: true, phone: true, isVerified: true } } }
  });
  console.log('=== ALL LENDERS (' + lenders.length + ') ===\n', JSON.stringify(lenders, null, 2));

  const userSubs = await prisma.userSubscription.findMany({
    include: { plan: true, user: { select: { email: true, role: true } } }
  });
  console.log('=== ALL USER SUBSCRIPTIONS (' + userSubs.length + ') ===\n', JSON.stringify(userSubs, null, 2));

  const payments = await prisma.payment.findMany({
    include: { user: { select: { email: true, role: true } } }
  });
  console.log('=== ALL PAYMENTS (' + payments.length + ') ===\n', JSON.stringify(payments, null, 2));

  const fraudReports = await (prisma.fraudReport ? prisma.fraudReport.findMany() : []);
  console.log('=== ALL FRAUD REPORTS (' + fraudReports.length + ') ===\n', JSON.stringify(fraudReports, null, 2));
}

main().finally(() => prisma.$disconnect());
