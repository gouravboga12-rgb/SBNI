import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { LenderType } from '@prisma/client';
import { calculateDistanceKm } from '../utils/distance';

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
    phone,
    email,
    avatarUrl,
    logoUrl,
  } = req.body;

  let parsedLat = latitude !== undefined && latitude !== null ? parseFloat(String(latitude)) : undefined;
  let parsedLng = longitude !== undefined && longitude !== null ? parseFloat(String(longitude)) : undefined;
  const parsedRadius = lendingRadiusKm !== undefined && lendingRadiusKm !== null ? parseFloat(String(lendingRadiusKm)) : undefined;

  let financerName = institutionName;
  if (financerName && !financerName.toLowerCase().includes('money financer')) {
    financerName = `${financerName} Money Financer`;
  }

  // Update user phone / email if provided
  if (userId && (phone || email || contactPersonName)) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: phone || undefined,
          email: email || undefined,
        },
      });
    } catch (e) {
      console.warn('Could not update user table phone/email:', e);
    }
  }

  if (parsedLat === undefined || parsedLng === undefined || (Math.abs(parsedLat - 19.076) < 0.01 && Math.abs(parsedLng - 72.8777) < 0.01)) {
    const combined = `${address || ''} ${place || ''} ${city || ''} ${state || ''}`.toLowerCase();
    if (combined.includes('hyderabad') || combined.includes('telangana') || combined.includes('kothapet') || combined.includes('chaitanyapuri') || combined.includes('secunderabad') || combined.includes('dilsukhnagar')) {
      parsedLat = 17.3850;
      parsedLng = 78.4867;
    } else if (combined.includes('delhi') || combined.includes('ncr') || combined.includes('gurgaon')) {
      parsedLat = 28.6139;
      parsedLng = 77.2090;
    } else if (combined.includes('bangalore') || combined.includes('bengaluru')) {
      parsedLat = 12.9716;
      parsedLng = 77.5946;
    } else if (combined.includes('chennai')) {
      parsedLat = 13.0827;
      parsedLng = 80.2707;
    } else if (combined.includes('pune')) {
      parsedLat = 18.5204;
      parsedLng = 73.8567;
    } else if (combined.includes('mumbai')) {
      parsedLat = 19.0760;
      parsedLng = 72.8777;
    }
  }

  const effectiveAvatar = avatarUrl || logoUrl || undefined;

  const profile = await (prisma.lenderProfile as any).upsert({
    where: { userId },
    update: {
      institutionName: financerName || undefined,
      institutionType: institutionType ? (institutionType as LenderType) : undefined,
      registrationNumber: registrationNumber || undefined,
      loanCategories: Array.isArray(loanCategories) ? JSON.stringify(loanCategories) : (loanCategories || undefined),
      minLoanAmount: minLoanAmount !== undefined && minLoanAmount !== null ? parseFloat(String(minLoanAmount)) : undefined,
      maxLoanAmount: maxLoanAmount !== undefined && maxLoanAmount !== null ? parseFloat(String(maxLoanAmount)) : undefined,
      minInterestRate: minInterestRate !== undefined && minInterestRate !== null ? parseFloat(String(minInterestRate)) : undefined,
      address: address || undefined,
      place: place || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      pincode: pincode || undefined,
      latitude: parsedLat,
      longitude: parsedLng,
      lendingRadiusKm: parsedRadius,
      contactPersonName: contactPersonName || undefined,
      avatarUrl: effectiveAvatar,
      logoUrl: effectiveAvatar,
    },
    create: {
      userId: userId!,
      institutionName: financerName || 'Business Money Financer',
      institutionType: (institutionType as LenderType) || 'NBFC',
      registrationNumber: registrationNumber || 'REG-1001',
      loanCategories: Array.isArray(loanCategories) ? JSON.stringify(loanCategories) : JSON.stringify(['Business Loan']),
      minLoanAmount: minLoanAmount !== undefined && minLoanAmount !== null ? parseFloat(String(minLoanAmount)) : 10000,
      maxLoanAmount: maxLoanAmount !== undefined && maxLoanAmount !== null ? parseFloat(String(maxLoanAmount)) : 100000,
      minInterestRate: minInterestRate !== undefined && minInterestRate !== null ? parseFloat(String(minInterestRate)) : 9.5,
      address: address || 'Default Address',
      place: place || 'Financial District',
      city: city || 'Hyderabad',
      state: state || 'Telangana',
      country: country || 'India',
      pincode: pincode || '500001',
      latitude: parsedLat ?? 17.3850,
      longitude: parsedLng ?? 78.4867,
      lendingRadiusKm: parsedRadius ?? 50.0,
      contactPersonName: contactPersonName || 'Lending Officer',
      avatarUrl: effectiveAvatar,
      logoUrl: effectiveAvatar,
    },
  });

  res.json({ success: true, message: 'Lender institution profile and lending area updated successfully.', data: profile });
};

export const getVendorProfiles = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { city, category } = req.query;

  let lenderLat = 17.3850;
  let lenderLng = 78.4867;
  let lenderRadiusKm = 50.0;

  if (userId) {
    const lp = await prisma.lenderProfile.findUnique({
      where: { userId },
    });
    if (lp) {
      lenderLat = lp.latitude ?? 17.3850;
      lenderLng = lp.longitude ?? 78.4867;
      lenderRadiusKm = lp.lendingRadiusKm ?? 50.0;
    }
  }

  const vendors = await prisma.vendorProfile.findMany({
    where: {
      isFraud: false,
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
    orderBy: { createdAt: 'desc' },
  });

  const formatted = vendors.map((v) => {
    const vLat = v.latitude ?? 17.3713;
    const vLng = v.longitude ?? 78.5320;
    const distanceKm = Math.round(calculateDistanceKm(lenderLat, lenderLng, vLat, vLng) * 10) / 10;
    const isWithinRadius = distanceKm <= lenderRadiusKm;

    // Resolve KYC documents
    const kycDocs = v.user?.kycDocuments || [];
    const panDoc = kycDocs.find((d) => d.docType === 'PAN');
    const aadhaarDoc = kycDocs.find((d) => d.docType === 'AADHAAR');
    const gstDoc = kycDocs.find((d) => d.docType === 'GST_CERTIFICATE');
    const shopDoc = kycDocs.find((d) => d.docType === 'BUSINESS_PROOF');

    return {
      id: v.id,
      vendorName: v.ownerName || 'Business Owner',
      shopName: v.businessName || 'Business Enterprise',
      category: v.category || 'Retail Shop',
      annualTurnover: v.annualTurnover || '10-50 Lakhs',
      monthlyIncome: '₹ 50,000 / month',
      address: v.address,
      place: v.place || 'Commercial Area',
      city: v.city,
      state: v.state,
      country: v.country || 'India',
      pincode: v.pincode,
      latitude: vLat,
      longitude: vLng,
      distanceKm,
      isWithinRadius,
      lendingRadiusKm: lenderRadiusKm,
      mobileNumber: v.user?.phone || 'Not provided',
      emailId: v.user?.email || 'vendor@justpaisa.com',
      panNumber: v.panNumber || panDoc?.documentNumber || 'ABCDE1234F',
      aadhaarNumber: (v as any).aadhaarNumber || aadhaarDoc?.documentNumber || 'XXXX-XXXX-9012',
      gstNumber: v.gstNumber || gstDoc?.documentNumber || '36ABCDE1234F1Z5',
      kycStatus: v.kycStatus,
      avatarUrl: v.avatarUrl || v.logoUrl || null,
      panFileUrl: panDoc?.fileUrl || null,
      aadhaarFileUrl: aadhaarDoc?.fileUrl || null,
      shopLicensePdf: shopDoc?.fileUrl || null,
      gstCertificatePdf: gstDoc?.fileUrl || null,
      shopPhotoUrl: v.logoUrl || v.avatarUrl || null,
      liveSelfieUrl: v.avatarUrl || null,
      kycDocuments: kycDocs,
    };
  });

  formatted.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({ success: true, count: formatted.length, data: formatted });
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
      where: {
        OR: [
          { lenderId: lenderProfile.id },
          { lenderId: lenderProfile.registrationNumber },
          { lenderId: lenderProfile.institutionName },
        ],
      },
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

