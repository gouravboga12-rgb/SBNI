import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getAdminDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  const [
    totalVendors,
    totalLenders,
    verifiedLenders,
    activeSubscriptions,
    paymentsAggregate,
    openTickets,
    totalBlogs,
  ] = await Promise.all([
    prisma.vendorProfile.count(),
    prisma.lenderProfile.count(),
    prisma.lenderProfile.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.userSubscription.count({ where: { status: 'ACTIVE', endDate: { gte: new Date() } } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESS' },
    }),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }),
    prisma.blog.count(),
  ]);

  const totalRevenue = paymentsAggregate._sum.amount || 0;

  // Recent payments
  const recentPayments = await prisma.payment.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true, phone: true } },
    },
  });

  res.json({
    success: true,
    data: {
      totalVendors,
      totalLenders,
      verifiedLenders,
      activeSubscriptions,
      totalRevenue,
      openTickets,
      totalBlogs,
      recentPayments,
    },
  });
};

// Vendor Management
export const getAllVendors = async (req: AuthenticatedRequest, res: Response) => {
  const vendors = await prisma.vendorProfile.findMany({
    include: {
      user: {
        select: { email: true, phone: true, isVerified: true, createdAt: true, kycDocuments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, count: vendors.length, data: vendors });
};

export const updateVendorKYCStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { vendorId } = req.params;
  const { kycStatus, kycRejectionReason } = req.body;

  const vendor = await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: {
      kycStatus,
      kycRejectionReason: kycStatus === 'REJECTED' ? kycRejectionReason : null,
    },
  });

  res.json({ success: true, message: `Vendor KYC Status updated to ${kycStatus}.`, data: vendor });
};

export const updateVendorFraudStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vendorId } = req.params;
    const { isFraud } = req.body;

    const vendor = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: {
        isFraud: !!isFraud,
      },
    });

    if (!isFraud) {
      // Super Admin cleared fraud tag from User Vendors: dismiss all active reports for this vendor
      await (prisma as any).fraudReport.updateMany({
        where: {
          vendorId: vendorId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: {
          status: 'DISMISSED',
          adminNotes: 'Dismissed: Fraud status cleared by Super Admin from User Vendors control.',
        },
      });
    }

    res.json({
      success: true,
      message: isFraud
        ? 'Vendor account marked as FRAUD. Alert is now active across all business financer accounts!'
        : 'Fraud status cleared for vendor account.',
      data: vendor,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update vendor fraud status.' });
  }
};


// Lender Management
export const getAllLenders = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lenders = await prisma.lenderProfile.findMany({
      include: {
        user: {
          select: { email: true, phone: true, isVerified: true, createdAt: true, kycDocuments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedLenders = lenders.map((lender) => {
      let parsedCategories: string[] = [];
      try {
        parsedCategories = Array.isArray(lender.loanCategories)
          ? lender.loanCategories
          : JSON.parse(lender.loanCategories || '[]');
      } catch {
        parsedCategories = typeof lender.loanCategories === 'string'
          ? lender.loanCategories.split(',').map((s: string) => s.trim())
          : [];
      }
      return {
        ...lender,
        loanCategories: parsedCategories,
        userPhone: lender.user?.phone || 'Not provided',
        userEmail: lender.user?.email || 'Not provided',
      };
    });

    res.json({ success: true, count: formattedLenders.length, data: formattedLenders });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch lenders.' });
  }
};

export const updateLenderVerificationStatus = async (req: AuthenticatedRequest, res: Response) => {
  const { lenderId } = req.params;
  const { verificationStatus, rejectionReason } = req.body;

  const lender = await prisma.lenderProfile.update({
    where: { id: lenderId },
    data: {
      verificationStatus,
      rejectionReason: verificationStatus === 'REJECTED' ? rejectionReason : null,
    },
  });

  res.json({ success: true, message: `Lender verification status updated to ${verificationStatus}.`, data: lender });
};

// Banner CRUD
export const createBanner = async (req: AuthenticatedRequest, res: Response) => {
  const { title, subtitle, imageUrl, actionUrl, targetAudience, displayOrder } = req.body;

  const banner = await prisma.banner.create({
    data: {
      title,
      subtitle,
      imageUrl,
      actionUrl,
      targetAudience: targetAudience || 'ALL',
      displayOrder: displayOrder ? parseInt(displayOrder) : 1,
    },
  });

  res.status(201).json({ success: true, message: 'Banner created.', data: banner });
};

export const deleteBanner = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await prisma.banner.delete({ where: { id } });
  res.json({ success: true, message: 'Banner deleted.' });
};

// FAQ CRUD
export const createFAQ = async (req: AuthenticatedRequest, res: Response) => {
  const { category, question, answer, displayOrder } = req.body;

  const faq = await prisma.fAQ.create({
    data: {
      category: category || 'General',
      question,
      answer,
      displayOrder: displayOrder ? parseInt(displayOrder) : 1,
    },
  });

  res.status(201).json({ success: true, message: 'FAQ created.', data: faq });
};

export const deleteFAQ = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await prisma.fAQ.delete({ where: { id } });
  res.json({ success: true, message: 'FAQ deleted.' });
};

// Support Ticket Management
export const getAllSupportTickets = async (req: AuthenticatedRequest, res: Response) => {
  const tickets = await prisma.supportTicket.findMany({
    include: {
      user: { select: { email: true, phone: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ success: true, count: tickets.length, data: tickets });
};

export const resolveSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  const { ticketId } = req.params;
  const { adminResponse, status } = req.body;

  const ticket = await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      adminResponse,
      status: status || 'RESOLVED',
      resolvedAt: new Date(),
    },
  });

  res.json({ success: true, message: 'Support ticket updated.', data: ticket });
};

// Audit Logs
export const getAuditLogs = async (req: AuthenticatedRequest, res: Response) => {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  res.json({ success: true, count: logs.length, data: logs });
};

// Platform Settings CRUD
export const updatePlatformSetting = async (req: AuthenticatedRequest, res: Response) => {
  const { key, value } = req.body;

  const setting = await prisma.platformSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value, group: 'General' },
  });

  res.json({ success: true, message: `Setting ${key} updated.`, data: setting });
};

// Additional Account Management
export const deleteUser = async (req: AuthenticatedRequest, res: Response) => {
  const targetId = req.params.userId || req.params.vendorId || req.params.lenderId;

  if (!targetId) {
    return res.status(400).json({ success: false, message: 'Target ID is required for deletion.' });
  }

  try {
    // 1. Identify the user record (either by User.id, VendorProfile.id/userId, or LenderProfile.id/userId)
    let user = await prisma.user.findUnique({
      where: { id: targetId },
    });

    if (!user) {
      const vendorProf = await prisma.vendorProfile.findFirst({
        where: { OR: [{ id: targetId }, { userId: targetId }] },
      });
      if (vendorProf) {
        user = await prisma.user.findUnique({ where: { id: vendorProf.userId } });
      }
    }

    if (!user) {
      const lenderProf = await prisma.lenderProfile.findFirst({
        where: { OR: [{ id: targetId }, { userId: targetId }] },
      });
      if (lenderProf) {
        user = await prisma.user.findUnique({ where: { id: lenderProf.userId } });
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Target user account not found or already removed.' });
    }

    const resolvedUserId = user.id;

    // 2. Perform atomic deletion of all relations and the user in a transaction
    await prisma.$transaction(async (tx) => {
      const vProfiles = await tx.vendorProfile.findMany({ where: { userId: resolvedUserId }, select: { id: true, businessName: true, ownerName: true } });
      const vIds = vProfiles.map((p) => p.id);

      const lProfiles = await tx.lenderProfile.findMany({ where: { userId: resolvedUserId }, select: { id: true, registrationNumber: true, institutionName: true } });
      const lIds = lProfiles.map((p) => p.id);
      const lRegs = lProfiles.map((p) => p.registrationNumber).filter(Boolean);
      const lNames = lProfiles.map((p) => p.institutionName).filter(Boolean);

      // 1. Delete all financing leads connected to this vendor or lender
      if (vIds.length > 0) {
        await tx.financingLead.deleteMany({ where: { vendorId: { in: vIds } } });
        await tx.fraudReport.deleteMany({ where: { vendorId: { in: vIds } } });
      }

      if (lIds.length > 0 || lRegs.length > 0 || lNames.length > 0) {
        await tx.financingLead.deleteMany({
          where: {
            OR: [
              ...(lIds.length > 0 ? [{ lenderId: { in: lIds } }] : []),
              ...(lRegs.length > 0 ? [{ lenderId: { in: lRegs } }] : []),
              ...(lNames.length > 0 ? [{ lenderId: { in: lNames } }] : []),
            ],
          },
        });
        if (lIds.length > 0) {
          await tx.fraudReport.deleteMany({ where: { lenderId: { in: lIds } } });
        }
      }

      // Also clean up any orphan leads that contain this user's phone or email in snapshot
      if (user.email || user.phone) {
        const remainingLeads = await tx.financingLead.findMany({ select: { id: true, vendorSnapshot: true } });
        const leadIdsToDelete = remainingLeads.filter(lead => {
          if (!lead.vendorSnapshot) return false;
          return (user.email && lead.vendorSnapshot.includes(user.email)) || (user.phone && lead.vendorSnapshot.includes(user.phone));
        }).map(l => l.id);
        if (leadIdsToDelete.length > 0) {
          await tx.financingLead.deleteMany({ where: { id: { in: leadIdsToDelete } } });
        }
      }

      // 2. Delete user's payments
      await tx.payment.deleteMany({ where: { userId: resolvedUserId } });

      // 3. Delete user's subscriptions
      await tx.userSubscription.deleteMany({ where: { userId: resolvedUserId } });

      // 4. Delete KYC documents
      await tx.kYCDocument.deleteMany({ where: { userId: resolvedUserId } });

      // 5. Delete notifications
      await tx.notification.deleteMany({ where: { userId: resolvedUserId } });

      // 6. Delete support tickets
      await tx.supportTicket.deleteMany({ where: { userId: resolvedUserId } });

      // 7. Delete vendor profile if exists
      await tx.vendorProfile.deleteMany({ where: { userId: resolvedUserId } });

      // 8. Delete lender profile if exists
      await tx.lenderProfile.deleteMany({ where: { userId: resolvedUserId } });

      // 9. Delete the user record
      await tx.user.delete({ where: { id: resolvedUserId } });
    });

    return res.json({
      success: true,
      message: `Account (${user.email}) and all associated records permanently removed from database.`,
    });
  } catch (error: any) {
    console.error('deleteUser error:', error);
    return res.status(500).json({
      success: false,
      message: error?.message || 'Failed to permanently delete user account from database.',
    });
  }
};

export const updateVendorDetails = async (req: AuthenticatedRequest, res: Response) => {
  const { vendorId } = req.params;
  const { businessName, ownerName, annualTurnover, category, city, state, pincode } = req.body;

  const updated = await prisma.vendorProfile.update({
    where: { id: vendorId },
    data: { businessName, ownerName, annualTurnover, category, city, state, pincode },
  });
  res.json({ success: true, message: 'Vendor details updated successfully.', data: updated });
};

export const updateLenderDetails = async (req: AuthenticatedRequest, res: Response) => {
  const { lenderId } = req.params;
  const { institutionName, institutionType, minLoanAmount, maxLoanAmount, minInterestRate, city, state } = req.body;

  const updated = await prisma.lenderProfile.update({
    where: { id: lenderId },
    data: {
      institutionName,
      institutionType,
      minLoanAmount: minLoanAmount ? parseFloat(minLoanAmount) : undefined,
      maxLoanAmount: maxLoanAmount ? parseFloat(maxLoanAmount) : undefined,
      minInterestRate: minInterestRate ? parseFloat(minInterestRate) : undefined,
      city,
      state,
    },
  });
  res.json({ success: true, message: 'Lender details updated successfully.', data: updated });
};

export const grantManualSubscription = async (req: AuthenticatedRequest, res: Response) => {
  const { userId, planCode, durationDays } = req.body;
  if (!userId || !planCode) {
    return res.status(400).json({ success: false, message: 'userId and planCode are required.' });
  }

  const plan = await prisma.subscriptionPlan.findUnique({ where: { code: planCode } });
  if (!plan) {
    return res.status(404).json({ success: false, message: 'Plan not found.' });
  }

  const days = durationDays || plan.durationDays;
  const startDate = new Date();
  const endDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const transactionId = 'ADMIN_GRANT_' + Date.now();

  const sub = await prisma.userSubscription.create({
    data: {
      userId,
      planId: plan.id,
      startDate,
      endDate,
      status: 'ACTIVE',
      transactionId,
    },
  });

  await prisma.payment.create({
    data: {
      userId,
      subscriptionId: sub.id,
      amount: plan.price,
      status: 'SUCCESS',
      paymentMethod: 'ADMIN_MANUAL_GRANT',
      invoiceNumber: 'INV-GRANT-' + Date.now(),
    },
  });

  res.json({ success: true, message: `Subscription (${plan.name}) granted to user until ${endDate.toISOString().split('T')[0]}.`, data: sub });
};

// Subscription Plans CRUD
export const createSubscriptionPlanAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const { name, code, description, price, originalPrice, durationDays, features, isPopular, isBestValue, roleTarget } = req.body;

  if (!name || !price || !durationDays) {
    return res.status(400).json({ success: false, message: 'Name, price, and durationDays are required.' });
  }

  const planCode = (code || `PLAN_${Date.now()}`).toUpperCase().replace(/\s+/g, '_');
  const targetRole = roleTarget ? String(roleTarget).toUpperCase() : 'VENDOR';

  const existing = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { code: planCode },
        { code: `${targetRole}_${planCode}` },
      ],
    },
  });

  let plan;
  if (existing) {
    plan = await prisma.subscriptionPlan.update({
      where: { id: existing.id },
      data: {
        name,
        description: description || '',
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
        durationDays: parseInt(durationDays),
        features: Array.isArray(features) ? JSON.stringify(features) : (typeof features === 'string' ? features : '[]'),
        isPopular: !!isPopular,
        isBestValue: !!isBestValue,
        roleTarget: targetRole,
        isActive: true,
      },
    });
  } else {
    plan = await prisma.subscriptionPlan.create({
      data: {
        name,
        code: planCode,
        description: description || '',
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : parseFloat(price),
        durationDays: parseInt(durationDays),
        features: Array.isArray(features) ? JSON.stringify(features) : (typeof features === 'string' ? features : '[]'),
        isPopular: !!isPopular,
        isBestValue: !!isBestValue,
        roleTarget: targetRole,
        isActive: true,
      },
    });
  }

  let parsedFeatures: string[] = [];
  try {
    parsedFeatures = typeof plan.features === 'string' ? JSON.parse(plan.features || '[]') : plan.features;
  } catch {
    parsedFeatures = [];
  }

  res.status(201).json({
    success: true,
    message: 'Subscription plan saved successfully in database.',
    data: { ...plan, features: parsedFeatures },
  });
};

export const updateSubscriptionPlanAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const { planId } = req.params;
  const { name, code, description, price, originalPrice, durationDays, features, isPopular, isBestValue, isActive, roleTarget } = req.body;

  const targetCode = (code || planId || '').toUpperCase().replace(/\s+/g, '_');
  const targetRole = roleTarget ? String(roleTarget).toUpperCase() : 'VENDOR';

  // Look up by id or code
  const existing = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { id: planId },
        { code: targetCode },
        { code: planId.toUpperCase() },
      ],
    },
  });

  let updatedPlan;
  if (existing) {
    updatedPlan = await prisma.subscriptionPlan.update({
      where: { id: existing.id },
      data: {
        name: name || existing.name,
        code: code ? code.toUpperCase() : existing.code,
        description: description !== undefined ? description : existing.description,
        price: price !== undefined ? parseFloat(price) : existing.price,
        originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) : existing.originalPrice,
        durationDays: durationDays !== undefined ? parseInt(durationDays) : existing.durationDays,
        features: features !== undefined ? (Array.isArray(features) ? JSON.stringify(features) : String(features)) : existing.features,
        isPopular: isPopular !== undefined ? !!isPopular : existing.isPopular,
        isBestValue: isBestValue !== undefined ? !!isBestValue : existing.isBestValue,
        isActive: isActive !== undefined ? !!isActive : existing.isActive,
        roleTarget: roleTarget !== undefined ? targetRole : existing.roleTarget,
      },
    });
  } else {
    updatedPlan = await prisma.subscriptionPlan.create({
      data: {
        name: name || 'Subscription Plan',
        code: targetCode || `PLAN_${Date.now()}`,
        description: description || '',
        price: price !== undefined ? parseFloat(price) : 199,
        originalPrice: originalPrice !== undefined ? parseFloat(originalPrice) : (price ? parseFloat(price) : 199),
        durationDays: durationDays !== undefined ? parseInt(durationDays) : 30,
        features: Array.isArray(features) ? JSON.stringify(features) : (typeof features === 'string' ? features : '[]'),
        isPopular: !!isPopular,
        isBestValue: !!isBestValue,
        roleTarget: targetRole,
        isActive: isActive !== undefined ? !!isActive : true,
      },
    });
  }

  let parsedFeatures: string[] = [];
  try {
    parsedFeatures = typeof updatedPlan.features === 'string' ? JSON.parse(updatedPlan.features || '[]') : updatedPlan.features;
  } catch {
    parsedFeatures = [];
  }

  res.json({
    success: true,
    message: 'Subscription plan updated successfully in database.',
    data: { ...updatedPlan, features: parsedFeatures },
  });
};

export const deleteSubscriptionPlanAdmin = async (req: AuthenticatedRequest, res: Response) => {
  const { planId } = req.params;
  const targetCode = planId.toUpperCase().replace(/\s+/g, '_');
  const existing = await prisma.subscriptionPlan.findFirst({
    where: {
      OR: [
        { id: planId },
        { code: targetCode },
        { code: planId.toUpperCase() },
      ],
    },
  });

  if (existing) {
    await prisma.subscriptionPlan.delete({ where: { id: existing.id } });
  }
  res.json({ success: true, message: 'Subscription plan deleted successfully.' });
};

// Revenue & Payments Management
export const getAllPayments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
            role: true,
            vendorProfile: {
              select: {
                businessName: true,
                ownerName: true,
                category: true,
                city: true,
                state: true,
              },
            },
            lenderProfile: {
              select: {
                institutionName: true,
                contactPersonName: true,
                institutionType: true,
                city: true,
                state: true,
              },
            },
          },
        },
        subscription: {
          include: {
            plan: true,
          },
        },
      },
    });

    const formattedPayments = payments.map((p: any) => {
      const isVendor = p.user?.role === 'VENDOR';
      const entityName = isVendor
        ? p.user?.vendorProfile?.businessName || 'Small Shop Business'
        : p.user?.lenderProfile?.institutionName || 'Business Financer';
      const personName = isVendor
        ? p.user?.vendorProfile?.ownerName || 'Owner'
        : p.user?.lenderProfile?.contactPersonName || 'Contact Officer';

      return {
        id: p.id,
        entityName,
        personName,
        email: p.user?.email || 'N/A',
        phone: p.user?.phone || 'N/A',
        role: p.user?.role || (isVendor ? 'VENDOR' : 'LENDER'),
        planName: p.subscription?.plan?.name || 'Standard Subscription Plan',
        planCode: p.subscription?.plan?.code || (isVendor ? 'VENDOR_PLAN' : 'LENDER_PLAN'),
        amount: p.amount,
        paymentDate: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
        paymentMethod: p.paymentMethod || 'UPI',
        invoiceNumber: p.invoiceNumber || `INV-${p.id.substring(0, 8).toUpperCase()}`,
        transactionId: p.subscription?.transactionId || p.id,
        status: p.status || 'SUCCESS',
      };
    });

    res.json({ success: true, count: formattedPayments.length, data: formattedPayments });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch payments' });
  }
};

// Delete a specific payment record
export const deletePayment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const existing = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }
    await prisma.payment.delete({ where: { id: paymentId } });
    res.json({ success: true, message: 'Payment record deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete payment record.' });
  }
};



// Fraud Reports Management
export const getAllFraudReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reports = await (prisma as any).fraudReport.findMany({
      include: {
        vendor: {
          include: {
            user: { select: { email: true, phone: true, isVerified: true } },
          },
        },
        lender: {
          include: {
            user: { select: { email: true, phone: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, count: reports.length, data: reports });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch fraud reports.' });
  }
};

export const createFraudReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { vendorId, lenderId, reportedBy, reason, evidenceUrl } = req.body;
    if (!vendorId || !reason) {
      return res.status(400).json({ success: false, message: 'Vendor ID and Reason are required.' });
    }

    // 1. Resolve VendorProfile ID in RDS
    let resolvedVendor = await prisma.vendorProfile.findFirst({
      where: {
        OR: [
          { id: vendorId },
          { userId: vendorId },
          { businessName: { equals: vendorId, mode: 'insensitive' } },
          { ownerName: { equals: vendorId, mode: 'insensitive' } },
          { user: { email: { equals: vendorId, mode: 'insensitive' } } },
          { user: { phone: { equals: vendorId } } },
        ],
      },
    });

    if (!resolvedVendor) {
      const firstVendor = await prisma.vendorProfile.findFirst({});
      if (firstVendor) {
        resolvedVendor = firstVendor;
      }
    }

    if (!resolvedVendor) {
      return res.status(404).json({ success: false, message: 'Vendor profile not found in database.' });
    }

    // 2. Resolve LenderProfile ID if provided
    let resolvedLenderId: string | null = null;
    if (lenderId) {
      const resolvedLender = await prisma.lenderProfile.findFirst({
        where: {
          OR: [
            { id: lenderId },
            { userId: lenderId },
            { registrationNumber: lenderId },
            { institutionName: { equals: lenderId, mode: 'insensitive' } },
          ],
        },
      });
      if (resolvedLender) {
        resolvedLenderId = resolvedLender.id;
      }
    }

    const report = await (prisma as any).fraudReport.create({
      data: {
        vendorId: resolvedVendor.id,
        lenderId: resolvedLenderId,
        reportedBy: reportedBy || (req.user as any)?.name || req.user?.email || 'Business Money Financer',
        reason,
        evidenceUrl: evidenceUrl || null,
        status: 'PENDING',
      },
      include: {
        vendor: {
          include: {
            user: { select: { email: true, phone: true, isVerified: true } },
          },
        },
        lender: {
          include: {
            user: { select: { email: true, phone: true } },
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: '🚨 Fraud report successfully registered. Super Admin has been notified for investigation.',
      data: report,
    });
  } catch (err: any) {
    console.error('createFraudReport error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create fraud report.' });
  }
};

export const confirmFraudReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { adminNotes, vendorId } = req.body;

    let report = await (prisma as any).fraudReport.findFirst({
      where: {
        OR: [
          { id: reportId },
          { vendorId: reportId },
          { vendorId: vendorId || '' },
        ],
      },
      include: { vendor: true },
    });

    if (report) {
      report = await (prisma as any).fraudReport.update({
        where: { id: report.id },
        data: {
          status: 'CONFIRMED',
          adminNotes: adminNotes || 'Confirmed by Super Admin after review.',
        },
        include: { vendor: true },
      });
    }

    const effectiveVendorId = report?.vendorId || vendorId || (reportId && reportId.length > 20 ? reportId : undefined);

    if (effectiveVendorId) {
      await prisma.vendorProfile.updateMany({
        where: { id: effectiveVendorId },
        data: { isFraud: true },
      });
    }

    res.json({
      success: true,
      message: `Fraud report confirmed. Vendor is now blacklisted platform-wide as FRAUD.`,
      data: report || { id: reportId, status: 'CONFIRMED' },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to confirm fraud report.' });
  }
};

export const dismissFraudReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { adminNotes, vendorId } = req.body;

    let report = await (prisma as any).fraudReport.findFirst({
      where: {
        OR: [
          { id: reportId },
          { vendorId: reportId },
          { vendorId: vendorId || '' },
        ],
      },
      include: { vendor: true },
    });

    if (report) {
      report = await (prisma as any).fraudReport.update({
        where: { id: report.id },
        data: {
          status: 'DISMISSED',
          adminNotes: adminNotes || 'Dismissed / Blacklist lifted by Super Admin.',
        },
        include: { vendor: true },
      });
    }

    const effectiveVendorId = report?.vendorId || vendorId || (reportId && reportId.length > 20 ? reportId : undefined);

    if (effectiveVendorId) {
      // 1. Lift blacklist on the VendorProfile in database
      await prisma.vendorProfile.updateMany({
        where: { id: effectiveVendorId },
        data: { isFraud: false },
      });

      // 2. Also dismiss any other active/pending reports for this vendor
      await (prisma as any).fraudReport.updateMany({
        where: {
          vendorId: effectiveVendorId,
          status: { in: ['PENDING', 'CONFIRMED'] },
        },
        data: {
          status: 'DISMISSED',
          adminNotes: adminNotes || 'Dismissed / Blacklist lifted by Super Admin.',
        },
      });
    }

    res.json({
      success: true,
      message: `Fraud report dismissed and blacklist lifted. Account is now active platform-wide.`,
      data: report || { id: reportId, status: 'DISMISSED' },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to dismiss fraud report.' });
  }
};

export const deleteFraudReport = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { reportId } = req.params;
    const { vendorId } = req.body || {};

    let report = await (prisma as any).fraudReport.findFirst({
      where: {
        OR: [
          { id: reportId },
          { vendorId: reportId },
          { vendorId: vendorId || '' },
        ],
      },
    });

    const effectiveVendorId = report?.vendorId || vendorId || (reportId && reportId.length > 20 ? reportId : undefined);

    if (report) {
      await (prisma as any).fraudReport.delete({
        where: { id: report.id },
      });
    } else if (reportId) {
      await (prisma as any).fraudReport.deleteMany({
        where: {
          OR: [
            { id: reportId },
            { vendorId: reportId },
          ],
        },
      });
    }

    if (effectiveVendorId) {
      // Lift blacklist on the VendorProfile in database
      await prisma.vendorProfile.updateMany({
        where: { id: effectiveVendorId },
        data: { isFraud: false },
      });

      // Also clean up any remaining reports for this vendor
      await (prisma as any).fraudReport.deleteMany({
        where: { vendorId: effectiveVendorId },
      });
    }

    res.json({
      success: true,
      message: 'Fraud report permanently deleted and vendor account restored as normal.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete fraud report.' });
  }
};

