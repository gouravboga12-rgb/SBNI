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
    city,
    state,
    pincode,
    latitude,
    longitude,
    contactPersonName,
  } = req.body;

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
      city,
      state,
      pincode,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
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
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      pincode: pincode || '400001',
      latitude: latitude ? parseFloat(latitude) : 19.0760,
      longitude: longitude ? parseFloat(longitude) : 72.8777,
      contactPersonName: contactPersonName || 'Lending Officer',
    },
  });

  res.json({ success: true, message: 'Lender institution profile updated successfully.', data: profile });
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
