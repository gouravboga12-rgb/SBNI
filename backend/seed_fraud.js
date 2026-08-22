const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vendor = await prisma.vendorProfile.findFirst({
    where: { isFraud: false }
  });
  const lender = await prisma.lenderProfile.findFirst({});
  if (!vendor) {
    console.log('No vendor found');
    return;
  }
  const rep = await prisma.fraudReport.create({
    data: {
      vendorId: vendor.id,
      lenderId: lender ? lender.id : null,
      reportedBy: lender ? lender.institutionName : 'Gourav Money Financer',
      reason: 'Suspicious financial activity and unverified KYC document submission.',
      status: 'PENDING'
    }
  });
  console.log('INSERTED FRAUD REPORT SUCCESS:', rep.id, rep.reportedBy, rep.reason);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
