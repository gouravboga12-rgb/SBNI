import prisma from './config/prisma';

async function checkLive() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      referralCode: true,
      referredById: true,
      walletBalance: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('=== RECENT 10 USERS ===\n', JSON.stringify(users, null, 2));

  const referrals = await prisma.referralRecord.findMany({
    include: {
      referrer: { select: { email: true, phone: true, walletBalance: true } },
      referee: { select: { email: true, phone: true, walletBalance: true } },
      subscriptionPlan: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('=== ALL REFERRAL RECORDS ===\n', JSON.stringify(referrals, null, 2));

  const walletTxs = await prisma.walletTransaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  console.log('=== RECENT WALLET TXS ===\n', JSON.stringify(walletTxs, null, 2));
}

checkLive()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
