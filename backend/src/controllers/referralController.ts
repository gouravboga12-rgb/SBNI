import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

/**
 * Generate a unique 8-character referral code
 */
export const generateUniqueReferralCode = async (role: string = 'VENDOR'): Promise<string> => {
  const prefix = role === 'LENDER' ? 'JPL' : 'JPV';
  let isUnique = false;
  let code = '';

  while (!isUnique) {
    const randomHex = Math.random().toString(36).substring(2, 7).toUpperCase();
    code = `${prefix}-${randomHex}`;
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
};

/**
 * Get current user's referral link, code, wallet balance, and referral history
 */
export const getMyReferralInfo = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        vendorProfile: true,
        lenderProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Auto-generate referral code if not already assigned
    if (!user.referralCode) {
      const newCode = await generateUniqueReferralCode(user.role);
      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: newCode },
        include: {
          vendorProfile: true,
          lenderProfile: true,
        },
      });
    }

    // Fetch referral records where this user is the referrer
    const referralRecords = await prisma.referralRecord.findMany({
      where: { referrerId: userId },
      include: {
        referee: {
          include: {
            vendorProfile: true,
            lenderProfile: true,
          },
        },
        subscriptionPlan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Compute metrics
    const totalInvited = referralRecords.length;
    const completedConversions = referralRecords.filter((r) => r.status === 'COMPLETED').length;
    const totalEarned = referralRecords
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.referrerReward || 0), 0);

    // Fetch wallet transactions
    const walletTransactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const totalRedeemed = walletTransactions
      .filter((t) => t.type === 'DEBIT')
      .reduce((sum, t) => sum + t.amount, 0);

    const formattedReferrals = referralRecords.map((r) => {
      const refName =
        r.referee?.vendorProfile?.businessName ||
        r.referee?.vendorProfile?.ownerName ||
        r.referee?.lenderProfile?.institutionName ||
        r.referee?.email ||
        'New Registered User';

      const refRole = r.referee?.role || 'VENDOR';

      return {
        id: r.id,
        refereeName: refName,
        refereeRole: refRole,
        referralCode: r.referralCode,
        status: r.status,
        planName: r.subscriptionPlan?.name || (r.status === 'COMPLETED' ? 'Standard Plan' : 'Pending Activation'),
        rewardAmount: r.referrerReward,
        joinedAt: r.createdAt,
        rewardedAt: r.rewardedAt,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        referralCode: user.referralCode,
        walletBalance: user.walletBalance || 0,
        totalEarned,
        totalRedeemed,
        totalInvited,
        completedConversions,
        referrals: formattedReferrals,
        recentTransactions: walletTransactions,
      },
    });
  } catch (err: any) {
    console.error('Error fetching referral info:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch referral details.',
    });
  }
};

/**
 * Get current user's wallet balance & transaction ledger
 */
export const getMyWallet = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, walletBalance: true },
    });

    const transactions = await prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({
      success: true,
      data: {
        balance: user?.walletBalance || 0,
        transactions,
      },
    });
  } catch (err: any) {
    console.error('Error fetching wallet:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch wallet transactions.',
    });
  }
};

/**
 * Admin: Get all referral transactions & audit summary
 */
export const getAdminReferrals = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const records = await prisma.referralRecord.findMany({
      include: {
        referrer: {
          include: {
            vendorProfile: true,
            lenderProfile: true,
          },
        },
        referee: {
          include: {
            vendorProfile: true,
            lenderProfile: true,
          },
        },
        subscriptionPlan: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalReferrals = records.length;
    const completedReferrals = records.filter((r) => r.status === 'COMPLETED').length;
    const totalReferrerRewards = records
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.referrerReward || 0), 0);
    const totalRefereeRewards = records
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.refereeReward || 0), 0);
    const totalAdminShare = records
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + (r.adminShare || 0), 0);

    const formattedRecords = records.map((r) => ({
      id: r.id,
      referralCode: r.referralCode,
      status: r.status,
      referrer: {
        id: r.referrer?.id,
        email: r.referrer?.email,
        phone: r.referrer?.phone,
        role: r.referrer?.role,
        name:
          r.referrer?.vendorProfile?.businessName ||
          r.referrer?.vendorProfile?.ownerName ||
          r.referrer?.lenderProfile?.institutionName ||
          r.referrer?.email,
      },
      referee: {
        id: r.referee?.id,
        email: r.referee?.email,
        phone: r.referee?.phone,
        role: r.referee?.role,
        name:
          r.referee?.vendorProfile?.businessName ||
          r.referee?.vendorProfile?.ownerName ||
          r.referee?.lenderProfile?.institutionName ||
          r.referee?.email,
      },
      plan: r.subscriptionPlan
        ? {
            id: r.subscriptionPlan.id,
            name: r.subscriptionPlan.name,
            price: r.subscriptionPlan.price,
          }
        : null,
      referrerReward: r.referrerReward,
      refereeReward: r.refereeReward,
      adminShare: r.adminShare,
      createdAt: r.createdAt,
      rewardedAt: r.rewardedAt,
    }));

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalReferrals,
          completedReferrals,
          conversionRate: totalReferrals > 0 ? Math.round((completedReferrals / totalReferrals) * 100) : 0,
          totalReferrerRewards,
          totalRefereeRewards,
          totalAdminShare,
          totalDisbursed: totalReferrerRewards + totalRefereeRewards,
        },
        records: formattedRecords,
      },
    });
  } catch (err: any) {
    console.error('Admin get referrals error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch admin referral audit.',
    });
  }
};

/**
 * Admin: Get per-plan referral rules for all subscription plans
 */
export const getPlanReferralRules = async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ roleTarget: 'asc' }, { price: 'asc' }],
    });

    const formattedPlans = plans.map((p) => ({
      id: p.id,
      name: p.name,
      code: p.code,
      roleTarget: p.roleTarget,
      price: p.price,
      durationDays: p.durationDays,
      referrerReward: p.referrerReward || 0,
      refereeReward: p.refereeReward || 0,
      adminShare: p.adminShare || Math.max(0, p.price - (p.referrerReward || 0) - (p.refereeReward || 0)),
      referralEnabled: p.referralEnabled ?? true,
      isActive: p.isActive,
    }));

    return res.status(200).json({
      success: true,
      data: formattedPlans,
    });
  } catch (err: any) {
    console.error('Error fetching plan referral rules:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to load plan referral rules.',
    });
  }
};

/**
 * Admin: Update per-plan referral reward settings
 */
export const updatePlanReferralRule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { planId } = req.params;
    const { referrerReward, refereeReward, adminShare, referralEnabled } = req.body;

    if (!planId) {
      return res.status(400).json({ success: false, message: 'Plan ID is required.' });
    }

    const cleanCode = String(planId).toUpperCase().replace(/\s+/g, '_');
    const plan = await prisma.subscriptionPlan.findFirst({
      where: {
        OR: [
          { id: planId },
          { code: planId },
          { code: cleanCode },
          { code: `VENDOR_${cleanCode}` },
          { code: `LENDER_${cleanCode}` },
        ],
      },
    });

    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
    }

    const refReward = Number(referrerReward) >= 0 ? Number(referrerReward) : (plan.referrerReward || 0);
    const refeeReward = Number(refereeReward) >= 0 ? Number(refereeReward) : (plan.refereeReward || 0);
    const calculatedAdminShare =
      Number(adminShare) >= 0 ? Number(adminShare) : Math.max(0, plan.price - refReward - refeeReward);

    const updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data: {
        referrerReward: refReward,
        refereeReward: refeeReward,
        adminShare: calculatedAdminShare,
        referralEnabled: typeof referralEnabled === 'boolean' ? referralEnabled : plan.referralEnabled,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Referral settings updated for plan: ${updatedPlan.name}`,
      data: updatedPlan,
    });
  } catch (err: any) {
    console.error('Error updating plan referral rule:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to update plan referral rule.',
    });
  }
};
