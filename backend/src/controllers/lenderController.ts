import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { LenderType } from '@prisma/client';

export const updateLenderProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const {
    institutionName,
    institutionType,
    registrationNumber,
    loanCategories,
    minLoanAmount,
    maxLoanAmount,
    minInterestRate,
    address,
    place,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
    lendingRadiusKm,
    contactPersonName,
  } = req.body;

  const parsedLat = latitude !== undefined && latitude !== null ? parseFloat(String(latitude)) : undefined;
  const parsedLng = longitude !== undefined && longitude !== null ? parseFloat(String(longitude)) : undefined;
  const parsedRadius = lendingRadiusKm !== undefined && lendingRadiusKm !== null ? parseFloat(String(lendingRadiusKm)) : undefined;

  const profile = await prisma.lenderProfile.upsert({
    where: { userId },
    update: {
      institutionName,
      institutionType: institutionType ? (institutionType as LenderType) : undefined,
      registrationNumber,
      loanCategories: Array.isArray(loanCategories) ? JSON.stringify(loanCategories) : loanCategories,
      minLoanAmount: minLoanAmount ? parseFloat(minLoanAmount) : undefined,
      maxLoanAmount: maxLoanAmount ? parseFloat(maxLoanAmount) : undefined,
      minInterestRate: minInterestRate ? parseFloat(minInterestRate) : undefined,
      address,
      place,
      city,
      state,
      country: country || 'India',
      pincode,
      latitude: parsedLat,
      longitude: parsedLng,
      lendingRadiusKm: parsedRadius,
      contactPersonName,
    },
    create: {
      userId: userId!,
      institutionName: institutionName || 'Financial Institution',
      institutionType: (institutionType as LenderType) || 'NBFC',
      registrationNumber: registrationNumber || 'REG-1001',
      loanCategories: Array.isArray(loanCategories) ? JSON.stringify(loanCategories) : JSON.stringify(['Business Loan']),
      minLoanAmount: minLoanAmount ? parseFloat(minLoanAmount) : 100000,
      maxLoanAmount: maxLoanAmount ? parseFloat(maxLoanAmount) : 10000000,
      minInterestRate: minInterestRate ? parseFloat(minInterestRate) : 9.5,
      address: address || 'Default Address',
      place: place || 'Financial District',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      country: country || 'India',
      pincode: pincode || '400001',
      latitude: parsedLat ?? 19.0760,
      longitude: parsedLng ?? 72.8777,
      lendingRadiusKm: parsedRadius ?? 50.0,
      contactPersonName: contactPersonName || 'Lending Officer',
    },
  });

  res.json({ success: true, message: 'Lender institution profile and lending area updated successfully.', data: profile });
};

export const getVendorProfiles = async (req: AuthenticatedRequest, res: Response) => {
  const { city, category, turnover } = req.query;

  const vendors = await prisma.vendorProfile.findMany({
    where: {
      city: city ? { contains: String(city), mode: 'insensitive' } : undefined,
      category: category ? { contains: String(category), mode: 'insensitive' } : undefined,
    },
    include: {
      user: {
        select: {
          email: true,
          phone: true,
          isVerified: true,
          kycDocuments: true,
        },
      },
    },
  });

  res.json({ success: true, count: vendors.length, data: vendors });
};

export const verifyVendorKYC = async (req: AuthenticatedRequest, res: Response) => {
  const { documentId, status, rejectionReason } = req.body;

  if (!documentId || !status) {
    return res.status(400).json({ success: false, message: 'Document ID and status are required.' });
  }

  const updatedDoc = await prisma.kYCDocument.update({
    where: { id: documentId },
    data: {
      status,
      rejectionReason: status === 'REJECTED' ? rejectionReason : null,
      verifiedAt: status === 'VERIFIED' ? new Date() : null,
    },
  });

  res.json({ success: true, message: `Vendor KYC Document status updated to ${status}.`, data: updatedDoc });
};

export const ingestLead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { lenderId, vendorId, type, amount, purpose, notes, vendorSnapshot } = req.body;

    if (!lenderId) {
      return res.status(400).json({ success: false, message: 'Lender ID is required.' });
    }

    const leadType = type || 'LOAN_APPLICATION';
    let leadNotes = notes;
    if (!leadNotes) {
      if (leadType === 'PHONE_CALL') leadNotes = '📞 Vendor initiated a Phone Call inquiry';
      else if (leadType === 'WHATSAPP') leadNotes = '💬 Vendor initiated a WhatsApp Chat inquiry';
      else leadNotes = '📝 Vendor submitted a loan application';
    }

    const lead = await (prisma as any).financingLead.create({
      data: {
        lenderId,
        vendorId: vendorId || null,
        type: leadType,
        status: 'Pending',
        amount: amount ? parseFloat(String(amount)) : null,
        purpose: purpose || null,
        notes: leadNotes,
        vendorSnapshot: vendorSnapshot ? (typeof vendorSnapshot === 'string' ? vendorSnapshot : JSON.stringify(vendorSnapshot)) : null,
      },
    });

    res.status(201).json({
      success: true,
      message: `Lead ingested successfully (${leadType}).`,
      data: lead,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to ingest lead.' });
  }
};

export const getLenderLeads = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const lenderProfile = await prisma.lenderProfile.findUnique({
      where: { userId },
    });

    if (!lenderProfile) {
      return res.status(404).json({ success: false, message: 'Lender profile not found.' });
    }

    const leads = await (prisma as any).financingLead.findMany({
      where: { lenderId: lenderProfile.id },
      include: {
        vendor: {
          include: {
            user: { select: { email: true, phone: true, isVerified: true, kycDocuments: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, count: leads.length, data: leads });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch lender leads.' });
  }
};

export const updateLeadStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leadId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const lead = await (prisma as any).financingLead.update({
      where: { id: leadId },
      data: { status },
    });

    res.json({
      success: true,
      message: `Lead status updated to ${status}.`,
      data: lead,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update lead status.' });
  }
};

