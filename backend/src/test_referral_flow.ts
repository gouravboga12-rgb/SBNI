import prisma from '../src/config/prisma';
import { processReferralRewardsForUser } from '../src/controllers/subscriptionController';

async function testReferralFlow() {
  console.log('================================================================');
  console.log('🧪 RUNNING END-TO-END REFER & EARN AUTOMATED VERIFICATION TEST');
  console.log('================================================================\n');

  try {
    // 1. Fetch an active subscription plan
    const activePlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });

    if (!activePlan) {
      console.error('❌ No active subscription plan found in database!');
      return;
    }

    console.log(`📋 Selected Test Plan: "${activePlan.name}" (${activePlan.code})`);
    console.log(`   - Price: ₹${activePlan.price}`);
    console.log(`   - Referrer Reward: ₹${activePlan.referrerReward ?? 200}`);
    console.log(`   - Referee Reward: ₹${activePlan.refereeReward ?? 0}`);
    console.log(`   - Referral Enabled: ${activePlan.referralEnabled !== false}\n`);

    // 2. Setup or identify a Referrer (User A)
    const referrerEmail = `test_referrer_${Date.now()}@example.com`;
    const referrerPhone = `98${Math.floor(10000000 + Math.random() * 90000000)}`;
    const referrerCode = `REF${Math.floor(1000 + Math.random() * 9000)}`;

    const referrer = await prisma.user.create({
      data: {
        email: referrerEmail,
        phone: referrerPhone,
        passwordHash: 'dummy_hash_for_testing',
        role: 'VENDOR',
        referralCode: referrerCode,
        walletBalance: 100, // Initial wallet balance
      },
    });

    console.log(`👤 Referrer Created (User A): ${referrer.phone} (Code: ${referrer.referralCode})`);
    console.log(`   - Initial Wallet Balance: ₹${referrer.walletBalance}\n`);

    // 3. Register a Referee (User B) who joins using Referrer's code
    const refereeEmail = `test_referee_${Date.now()}@example.com`;
    const refereePhone = `97${Math.floor(10000000 + Math.random() * 90000000)}`;

    const referee = await prisma.user.create({
      data: {
        email: refereeEmail,
        phone: refereePhone,
        passwordHash: 'dummy_hash_for_testing',
        role: 'VENDOR',
        referredById: referrer.id,
        walletBalance: 0,
      },
    });

    // Create the pending referral record as created in authController.register
    const referralRecord = await prisma.referralRecord.create({
      data: {
        referrerId: referrer.id,
        refereeId: referee.id,
        referralCode: referrerCode,
        status: 'REGISTERED',
      },
    });

    console.log(`👥 Referee Created (User B): ${referee.phone} (Referred by: ${referrer.phone})`);
    console.log(`   - Referral Record Created with status: "${referralRecord.status}" (ID: ${referralRecord.id})\n`);

    // 4. Simulate Referee purchasing / activating the subscription plan
    console.log(`💳 Simulating Plan Activation for User B on "${activePlan.name}"...`);
    await processReferralRewardsForUser(referee.id, activePlan);

    // 5. Verify Database State
    const updatedReferrer = await prisma.user.findUnique({ where: { id: referrer.id } });
    const updatedReferee = await prisma.user.findUnique({ where: { id: referee.id } });
    const updatedReferralRecord = await prisma.referralRecord.findUnique({ where: { id: referralRecord.id } });
    const referrerTxns = await prisma.walletTransaction.findMany({ where: { userId: referrer.id } });
    const refereeTxns = await prisma.walletTransaction.findMany({ where: { userId: referee.id } });

    console.log('\n================================================================');
    console.log('📊 VERIFICATION RESULTS:');
    console.log('================================================================');

    const expectedReferrerReward = activePlan.referralEnabled === false ? 0 : (activePlan.referrerReward ?? 200);
    const expectedRefereeReward = activePlan.referralEnabled === false ? 0 : (activePlan.refereeReward ?? 0);

    console.log(`1. Referrer Wallet Balance:`);
    console.log(`   - Before: ₹100`);
    console.log(`   - After:  ₹${updatedReferrer?.walletBalance} (Expected: ₹${100 + expectedReferrerReward})`);
    const referrerOk = updatedReferrer?.walletBalance === 100 + expectedReferrerReward;
    console.log(`   - Status: ${referrerOk ? '✅ PASS' : '❌ FAIL'}`);

    console.log(`\n2. Referee Wallet Balance:`);
    console.log(`   - Before: ₹0`);
    console.log(`   - After:  ₹${updatedReferee?.walletBalance} (Expected: ₹${expectedRefereeReward})`);
    const refereeOk = updatedReferee?.walletBalance === expectedRefereeReward;
    console.log(`   - Status: ${refereeOk ? '✅ PASS' : '❌ FAIL'}`);

    console.log(`\n3. Referral Record Status:`);
    console.log(`   - Current Status: "${updatedReferralRecord?.status}" (Expected: "COMPLETED")`);
    console.log(`   - Recorded Referrer Reward: ₹${updatedReferralRecord?.referrerReward}`);
    console.log(`   - Recorded Referee Reward:  ₹${updatedReferralRecord?.refereeReward}`);
    console.log(`   - Recorded Admin Share:     ₹${updatedReferralRecord?.adminShare}`);
    const recordOk = updatedReferralRecord?.status === 'COMPLETED';
    console.log(`   - Status: ${recordOk ? '✅ PASS' : '❌ FAIL'}`);

    console.log(`\n4. Wallet Audit Transactions:`);
    console.log(`   - Referrer Transactions: ${referrerTxns.length} (${referrerTxns.map(t => `${t.source}: +₹${t.amount}`).join(', ')})`);
    console.log(`   - Referee Transactions:  ${refereeTxns.length} (${refereeTxns.map(t => `${t.source}: +₹${t.amount}`).join(', ')})`);
    const txnsOk = referrerTxns.some(t => t.source === 'REFERRAL_BONUS');
    console.log(`   - Status: ${txnsOk ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n================================================================');
    if (referrerOk && refereeOk && recordOk && txnsOk) {
      console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! Referral system is 100% functional.');
    } else {
      console.log('⚠️ Some assertions failed. Please review the logs above.');
    }
    console.log('================================================================\n');

    // Clean up test records
    await prisma.walletTransaction.deleteMany({ where: { userId: { in: [referrer.id, referee.id] } } });
    await prisma.notification.deleteMany({ where: { userId: { in: [referrer.id, referee.id] } } });
    await prisma.referralRecord.deleteMany({ where: { id: referralRecord.id } });
    await prisma.user.deleteMany({ where: { id: { in: [referrer.id, referee.id] } } });
    console.log('🧹 Cleaned up temporary test accounts and test transactions.');

  } catch (err: any) {
    console.error('❌ Test execution error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testReferralFlow();
