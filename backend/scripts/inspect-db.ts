import prisma from '../src/config/prisma';

async function main() {
  const users = await prisma.user.findMany({
    include: {
      lenderProfile: true,
      vendorProfile: true,
    },
  });
  console.log('--- USERS IN DATABASE ---');
  for (const u of users) {
    console.log(`User [${u.id}] Email: ${u.email} Role: ${u.role}`);
    if (u.lenderProfile) {
      console.log('  LenderProfile:', {
        id: u.lenderProfile.id,
        institutionName: u.lenderProfile.institutionName,
        contactPersonName: u.lenderProfile.contactPersonName,
        minLoanAmount: u.lenderProfile.minLoanAmount,
        maxLoanAmount: u.lenderProfile.maxLoanAmount,
        avatarUrl: u.lenderProfile.avatarUrl ? u.lenderProfile.avatarUrl.substring(0, 50) + '...' : null,
        city: u.lenderProfile.city,
        state: u.lenderProfile.state,
      });
    }
    if (u.vendorProfile) {
      console.log('  VendorProfile:', {
        id: u.vendorProfile.id,
        businessName: u.vendorProfile.businessName,
        ownerName: u.vendorProfile.ownerName,
        annualTurnover: u.vendorProfile.annualTurnover,
        avatarUrl: u.vendorProfile.avatarUrl ? u.vendorProfile.avatarUrl.substring(0, 50) + '...' : null,
        city: u.vendorProfile.city,
        state: u.vendorProfile.state,
      });
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
