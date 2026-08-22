import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getSubscriptionPlans = async (req: Request, res: Response) => {
  const role = req.query.role as string;
  const whereClause: any = { isActive: true };
  if (role) {
    whereClause.roleTarget = role.toUpperCase();
  }

  const plans = await prisma.subscriptionPlan.findMany({
    where: whereClause,
    orderBy: { price: 'asc' },
  });

  const formattedPlans = plans.map((plan) => {
    let parsedFeatures: string[] = [];
    try {
      parsedFeatures = Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features || '[]');
    } catch {
      parsedFeatures = typeof plan.features === 'string' ? plan.features.split(',').map(s => s.trim()) : [];
    }
    return {
      ...plan,
      features: parsedFeatures,
    };
  });

  res.json({ success: true, count: formattedPlans.length, data: formattedPlans });
};

export const purchaseSubscriptionPlan = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { planId, couponCode, paymentMethod } = req.body;

  if (!planId) {
    return res.status(400).json({ success: false, message: 'Plan ID is required.' });
  }

  let plan = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { id: planId },
        { code: planId },
        { code: String(planId).toUpperCase() },
      ],
    },
  });

  if (!plan) {
    plan = await prisma.subscriptionPlan.findFirst({ where: { isActive: true } });
  }

  const durationDays = plan ? plan.durationDays : 30;
  const price = plan ? plan.price : 599;

  let finalPrice = price;
  let discountAmount = 0;

  if (couponCode && plan) {
    const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
    if (coupon && coupon.isActive && coupon.validUntil > new Date() && coupon.timesUsed < coupon.usageLimit) {
      discountAmount = Math.min((plan.price * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
      finalPrice = Math.max(0, plan.price - discountAmount);

      await prisma.coupon.update({
        where: { id: coupon.id },
        data: { timesUsed: { increment: 1 } },
      });
    }
  }

  // Calculate Subscription Start & End Date
  const startDate = new Date();
  const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = 'INV-SBNI-' + Math.floor(100000 + Math.random() * 900000);

  // Expire previous active subscriptions if any
  await prisma.userSubscription.updateMany({
    where: { userId: userId!, status: 'ACTIVE' },
    data: { status: 'EXPIRED' },
  });

  // Create new active user subscription
  const subscription = await prisma.userSubscription.create({
    data: {
      userId: userId!,
      planId: plan ? plan.id : planId,
      startDate,
      endDate,
      status: 'ACTIVE',
      transactionId,
    },
  });

  // Record Payment
  const payment = await prisma.payment.create({
    data: {
      userId: userId!,
      subscriptionId: subscription.id,
      amount: finalPrice,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: paymentMethod || 'UPI',
      invoiceNumber,
      gatewayOrderId: 'ORDER-' + transactionId,
      gatewayPaymentId: 'PAY-' + transactionId,
    },
  });

  // Trigger In-App Notification
  await prisma.notification.create({
    data: {
      userId: userId!,
      title: 'Subscription Activated 🎉',
      message: `Your ${plan ? plan.name : 'Vendor Membership'} is now active until ${endDate.toLocaleDateString()}. All Lender Phone Numbers & WhatsApp connects are unlocked!`,
      type: 'SUBSCRIPTION',
    },
  });

  res.status(201).json({
    success: true,
    hasActiveSubscription: true,
    message: 'Subscription purchased and activated successfully! Contact details unlocked.',
    data: {
      isActive: true,
      subscription,
      payment,
    },
  });
};

export const getMyActiveSubscription = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, hasActiveSubscription: false, message: 'Unauthorized' });
    }

    const subscription = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
      include: {
        plan: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) {
      return res.json({
        success: true,
        hasActiveSubscription: false,
        data: { isActive: false },
        message: 'No active subscription found.',
      });
    }

    let parsedFeatures: string[] = [];
    if (subscription.plan?.features) {
      try {
        parsedFeatures = Array.isArray(subscription.plan.features)
          ? subscription.plan.features
          : JSON.parse(subscription.plan.features);
      } catch {
        parsedFeatures = typeof subscription.plan.features === 'string'
          ? subscription.plan.features.split(',').map((s: string) => s.trim())
          : [];
      }
    }

    res.json({
      success: true,
      hasActiveSubscription: true,
      data: {
        isActive: true,
        ...subscription,
        plan: subscription.plan
          ? {
              ...subscription.plan,
              features: parsedFeatures,
            }
          : null,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, hasActiveSubscription: false, message: err.message });
  }
};
