import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import razorpayInstance, { razorpayKeyId, razorpayKeySecret } from '../config/razorpay';

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

export const getRazorpayConfig = async (_req: Request, res: Response) => {
  res.json({
    success: true,
    keyId: razorpayKeyId,
  });
};

/**
 * Creates a Razorpay Order for one-time payment OR a Razorpay Subscription for AutoPay
 */
export const createRazorpayOrder = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { planId, couponCode, isAutoPay } = req.body;

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
      }
    }

    const amountInPaise = Math.round(finalPrice * 100);

    // If AutoPay is requested (Razorpay Recurring Subscriptions)
    if (isAutoPay && amountInPaise > 0) {
      try {
        let period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly';
        let interval = 1;

        if (plan.durationDays <= 7) {
          period = 'weekly';
          interval = 1;
        } else if (plan.durationDays <= 31) {
          period = 'monthly';
          interval = 1;
        } else if (plan.durationDays <= 93) {
          period = 'monthly';
          interval = 3;
        } else if (plan.durationDays <= 186) {
          period = 'monthly';
          interval = 6;
        } else {
          period = 'yearly';
          interval = 1;
        }

        // Create or configure Razorpay Plan
        const rzpPlan = await razorpayInstance.plans.create({
          period,
          interval,
          item: {
            name: `SBNI ${plan.name} Auto-Renewal`,
            amount: amountInPaise,
            currency: 'INR',
            description: `${plan.name} AutoPay Subscription`,
          },
        });

        // Create Razorpay Subscription with total 12 cycles
        const rzpSubscription = await razorpayInstance.subscriptions.create({
          plan_id: rzpPlan.id,
          total_count: 12,
          customer_notify: 1,
          quantity: 1,
          notes: {
            userId: userId || '',
            planId: plan.id,
            couponCode: couponCode || '',
            isAutoPay: 'true',
          },
        });

        return res.status(200).json({
          success: true,
          mode: 'subscription',
          subscriptionId: rzpSubscription.id,
          planId: plan.id,
          amount: finalPrice,
          currency: 'INR',
          keyId: razorpayKeyId,
          plan,
        });
      } catch (autoPayErr: any) {
        console.warn('AutoPay plan creation fallback to standard order:', autoPayErr?.message || autoPayErr);
        // Fallback to standard order if plan setup fails on test accounts
      }
    }

    // Standard One-Time Razorpay Order
    const receipt = `rcpt_${Date.now().toString().slice(-8)}_${Math.floor(100 + Math.random() * 900)}`;
    const orderOptions: any = {
      amount: amountInPaise > 0 ? amountInPaise : 100, // min 1 INR for Razorpay order
      currency: 'INR',
      receipt,
      notes: {
        userId: userId || '',
        planId: plan.id,
        couponCode: couponCode || '',
        isAutoPay: isAutoPay ? 'true' : 'false',
      },
    };

    const rzpOrder = await razorpayInstance.orders.create(orderOptions);

    return res.status(200).json({
      success: true,
      mode: 'order',
      orderId: rzpOrder.id,
      planId: plan.id,
      amount: finalPrice,
      amountPaise: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: razorpayKeyId,
      plan,
    });
  } catch (err: any) {
    console.error('Error creating Razorpay order:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to initialize payment with Razorpay.',
    });
  }
};

/**
 * Verifies Razorpay payment signature & activates subscription
 */
export const verifyRazorpayPayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
      planId,
      couponCode,
      isAutoPay,
    } = req.body;

    if (!razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment verification parameters.' });
    }

    // Verify HMAC SHA256 Signature
    let isValid = false;

    if (razorpay_subscription_id) {
      // AutoPay Subscription signature verification: razorpay_payment_id + "|" + razorpay_subscription_id
      const bodyToSign = `${razorpay_payment_id}|${razorpay_subscription_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(bodyToSign)
        .digest('hex');
      isValid = expectedSignature === razorpay_signature;
    } else if (razorpay_order_id) {
      // One-time Order signature verification: razorpay_order_id + "|" + razorpay_payment_id
      const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto
        .createHmac('sha256', razorpayKeySecret)
        .update(bodyToSign)
        .digest('hex');
      isValid = expectedSignature === razorpay_signature;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Razorpay payment signature verification failed.',
      });
    }

    // Retrieve Plan
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
    if (couponCode && plan) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() } });
      if (coupon && coupon.isActive && coupon.validUntil > new Date() && coupon.timesUsed < coupon.usageLimit) {
        const discountAmount = Math.min((plan.price * coupon.discountPercentage) / 100, coupon.maxDiscountAmount);
        finalPrice = Math.max(0, plan.price - discountAmount);

        await prisma.coupon.update({
          where: { id: coupon.id },
          data: { timesUsed: { increment: 1 } },
        });
      }
    }

    const startDate = new Date();
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
    const invoiceNumber = 'INV-SBNI-' + Math.floor(100000 + Math.random() * 900000);

    // 1. Cancel previous Razorpay recurring mandates (if any) to prevent double charging on upgrades/switches
    try {
      const previousActiveSubs = await prisma.userSubscription.findMany({
        where: { userId, status: 'ACTIVE' },
        include: { payments: true },
      });

      for (const prevSub of previousActiveSubs) {
        for (const p of prevSub.payments) {
          if (
            p.gatewayOrderId &&
            p.gatewayOrderId.startsWith('sub_') &&
            p.gatewayOrderId !== razorpay_subscription_id
          ) {
            try {
              await razorpayInstance.subscriptions.cancel(p.gatewayOrderId, false);
              console.log(`Cancelled previous Razorpay recurring mandate: ${p.gatewayOrderId}`);
            } catch (cancelErr: any) {
              console.warn(`Could not cancel previous Razorpay sub ${p.gatewayOrderId}:`, cancelErr?.message);
            }
          }
        }
      }
    } catch (cleanErr: any) {
      console.warn('Error cleaning up previous recurring mandates:', cleanErr?.message);
    }

    // 2. Expire previous active subscriptions in database
    await prisma.userSubscription.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'EXPIRED' },
    });

    // 3. Create new active UserSubscription with upgraded validity
    const subscription = await prisma.userSubscription.create({
      data: {
        userId,
        planId: plan ? plan.id : planId,
        startDate,
        endDate,
        status: 'ACTIVE',
        transactionId: razorpay_payment_id,
      },
    });

    // Create Payment Record
    const payment = await prisma.payment.create({
      data: {
        userId,
        subscriptionId: subscription.id,
        amount: finalPrice,
        currency: 'INR',
        status: 'SUCCESS',
        paymentMethod: isAutoPay || razorpay_subscription_id ? 'RAZORPAY_AUTOPAY' : 'RAZORPAY',
        invoiceNumber,
        gatewayOrderId: razorpay_order_id || razorpay_subscription_id || null,
        gatewayPaymentId: razorpay_payment_id,
      },
    });

    // Create In-App Notification
    await prisma.notification.create({
      data: {
        userId,
        title: isAutoPay ? 'AutoPay Subscription Activated 🚀' : 'Subscription Activated 🎉',
        message: `Your ${plan ? plan.name : 'Membership'} is now active until ${endDate.toLocaleDateString('en-IN')}.${
          isAutoPay ? ' Auto-renewal is enabled.' : ''
        } Lender contact details & WhatsApp connects are unlocked!`,
        type: 'SUBSCRIPTION',
      },
    });

    return res.status(200).json({
      success: true,
      hasActiveSubscription: true,
      message: 'Payment verified and subscription activated successfully!',
      data: {
        isActive: true,
        subscription,
        payment,
      },
    });
  } catch (err: any) {
    console.error('Error verifying payment:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Payment verification failed.',
    });
  }
};

/**
 * Direct purchase endpoint (Fallback / offline purchase)
 */
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

  const startDate = new Date();
  const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
  const transactionId = 'TXN-' + Date.now() + '-' + Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = 'INV-SBNI-' + Math.floor(100000 + Math.random() * 900000);
  // 1. Cancel previous Razorpay recurring mandates (if any)
  try {
    const previousActiveSubs = await prisma.userSubscription.findMany({
      where: { userId: userId!, status: 'ACTIVE' },
      include: { payments: true },
    });

    for (const prevSub of previousActiveSubs) {
      for (const p of prevSub.payments) {
        if (p.gatewayOrderId && p.gatewayOrderId.startsWith('sub_')) {
          try {
            await razorpayInstance.subscriptions.cancel(p.gatewayOrderId, false);
          } catch (cancelErr: any) {}
        }
      }
    }
  } catch (cleanErr: any) {}

  // 2. Expire previous active subscriptions
  await prisma.userSubscription.updateMany({
    where: { userId: userId!, status: 'ACTIVE' },
    data: { status: 'EXPIRED' },
  });

  // 3. Create new active user subscription
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
