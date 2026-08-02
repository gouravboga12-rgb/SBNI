import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getSubscriptionPlans = async (req: Request, res: Response) => {
  const plans = await prisma.subscriptionPlan.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' },
  });

  const formattedPlans = plans.map((plan) => ({
    ...plan,
    features: JSON.parse(plan.features || '[]'),
  }));

  res.json({ success: true, count: formattedPlans.length, data: formattedPlans });
};

export const purchaseSubscriptionPlan = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { planId, couponCode, paymentMethod } = req.body;

  if (!planId) {
    return res.status(400).json({ success: false, message: 'Plan ID is required.' });
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Subscription plan not found.' });
  }

  let finalPrice = plan.price;
  let discountAmount = 0;

  if (couponCode) {
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
  const endDate = new Date(Date.now() + plan.durationDays * 24 * 60 * 60 * 1000);
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
      planId: plan.id,
      startDate,
      endDate,
      status: 'ACTIVE',
      transactionId,
    },
    include: { plan: true },
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
      message: `Your ${plan.name} is now active until ${endDate.toLocaleDateString()}. All Lender Phone Numbers & WhatsApp connects are unlocked!`,
      type: 'SUBSCRIPTION',
    },
  });

  res.status(201).json({
    success: true,
    message: 'Subscription purchased and activated successfully! Contact details unlocked.',
    data: {
      subscription: {
        ...subscription,
        plan: {
          ...subscription.plan,
          features: JSON.parse(subscription.plan.features || '[]'),
        },
      },
      payment,
    },
  });
};

export const getMyActiveSubscription = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

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
      message: 'No active subscription found.',
    });
  }

  res.json({
    success: true,
    hasActiveSubscription: true,
    data: {
      ...subscription,
      plan: {
        ...subscription.plan,
        features: JSON.parse(subscription.plan.features || '[]'),
      },
    },
  });
};
