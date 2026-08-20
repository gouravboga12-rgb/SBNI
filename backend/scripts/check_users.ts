import prisma from '../src/config/prisma';

async function check() {
  const users = await prisma.user.findMany({
    include: { vendorProfile: true, lenderProfile: true },
  });
  console.log('TOTAL USERS IN DB:', users.length);
  console.log(JSON.stringify(users.map(u => ({
    id: u.id,
    email: u.email,
    phone: u.phone,
    role: u.role,
    isDeleted: u.isDeleted,
    hasVendorProf: !!u.vendorProfile,
    vendorProfId: u.vendorProfile?.id,
    hasLenderProf: !!u.lenderProfile,
    lenderProfId: u.lenderProfile?.id,
  })), null, 2));

  const vendors = await prisma.vendorProfile.findMany({ include: { user: true } });
  console.log('TOTAL VENDOR PROFILES:', vendors.length);

  const lenders = await prisma.lenderProfile.findMany({ include: { user: true } });
  console.log('TOTAL LENDER PROFILES:', lenders.length);
}

check().catch(console.error).finally(() => prisma.$disconnect());
