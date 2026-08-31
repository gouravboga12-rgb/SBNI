import prisma from './config/prisma';
import { processReferralRewardsForUser } from './controllers/subscriptionController';

async function healAndBackfill() {
  console.log('================================================================');
  console.log('🚀 RUNNING REFERRAL HEALING & DATABASE BACKFILL SCRIPT');
  console.log('================================================================\n');

  // 1. Backfill missing referral codes for all users
  const allUsers = await prisma.user.findMany();
  console.log(`Found ${allUsers.length} total users in database.`);

  for (const user of allUsers) {
    if (!user.referralCode) {
      const prefix = user.role === 'LENDER' ? 'JPL' : 'JPV';
      let uniqueCode = '';
      let isUnique = false;
      while (!isUnique) {
        const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
        uniqueCode = `${prefix}-${randomHex}`;
        const existing = await prisma.user.findUnique({ where: { referralCode: uniqueCode } });
        if (!existing) isUnique = true;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { referralCode: uniqueCode },
      });
      console.log(`✅ Assigned unique referral code "${uniqueCode}" to ${user.email} (${user.role})`);
    } else {
      console.log(`ℹ️  User ${user.email} already has referral code: ${user.referralCode}`);
    }
  }

  // 2. Identify the referrer account (e.g. bogagourav69@gmail.com or bogagourav10@gmail.com)
  const referrerUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'bogagourav69@gmail.com' },
        { email: 'bogagourav10@gmail.com' },
        { email: 'gouravboga12@gmail.com' },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  const refereeUser = await prisma.user.findFirst({
    where: { email: 'bogaravikumar680@gmail.com' },
    include: { subscriptions: { include: { plan: true } } },
  });

  if (referrerUser && refereeUser) {
    console.log(`\n🔗 Linking referee ${refereeUser.email} to referrer ${referrerUser.email} (${referrerUser.referralCode})...`);

    await prisma.user.update({
      where: { id: refereeUser.id },
      data: { referredById: referrerUser.id },
    });

    let existingRefRecord = await prisma.referralRecord.findFirst({
      where: { refereeId: refereeUser.id },
    });

    if (!existingRefRecord) {
      existingRefRecord = await prisma.referralRecord.create({
        data: {
          referrerId: referrerUser.id,
          refereeId: refereeUser.id,
          referralCode: referrerUser.referralCode || 'JPV-REFERRAL',
          status: 'REGISTERED',
        },
      });
      console.log(`✅ Created ReferralRecord for ${refereeUser.email} (ID: ${existingRefRecord.id})`);
    }

    // Process reward with active plan
    const activeSub = refereeUser.subscriptions.find((s) => s.status === 'ACTIVE') || refereeUser.subscriptions[0];
    if (activeSub && activeSub.plan) {
      console.log(`💳 Triggering referral reward for active plan: "${activeSub.plan.name}" (Price: ₹${activeSub.plan.price})...`);
      await processReferralRewardsForUser(refereeUser.id, activeSub.plan, referrerUser.referralCode || undefined);
    }
  }

  // 3. Print Final State
  console.log('\n================================================================');
  console.log('📊 FINAL REFERRAL AUDIT SUMMARY');
  console.log('================================================================');

  const finalUsers = await prisma.user.findMany({
    select: { email: true, phone: true, role: true, referralCode: true, walletBalance: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('Users & Wallets:\n', JSON.stringify(finalUsers, null, 2));

  const allRecords = await prisma.referralRecord.findMany({
    include: {
      referrer: { select: { email: true } },
      referee: { select: { email: true } },
      subscriptionPlan: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  console.log('\nReferral Records:\n', JSON.stringify(allRecords, null, 2));

  const allTxns = await prisma.walletTransaction.findMany({
    orderBy: { createdAt: 'desc' },
  });
  console.log('\nWallet Transactions:\n', JSON.stringify(allTxns, null, 2));
}

healAndBackfill()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Healing failed:', e);
    process.exit(1);
  });
