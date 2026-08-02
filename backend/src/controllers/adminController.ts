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

// Lender Management
export const getAllLenders = async (req: AuthenticatedRequest, res: Response) => {
  const lenders = await prisma.lenderProfile.findMany({
    include: {
      user: {
        select: { email: true, phone: true, isVerified: true, createdAt: true, kycDocuments: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedLenders = lenders.map((lender) => ({
    ...lender,
    loanCategories: JSON.parse(lender.loanCategories || '[]'),
  }));

  res.json({ success: true, count: formattedLenders.length, data: formattedLenders });
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
