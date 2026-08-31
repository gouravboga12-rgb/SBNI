import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { LenderType } from '@prisma/client';
import { calculateDistanceKm } from '../utils/distance';
import { emitToUser, emitToRole, emitToAdmin } from '../services/socketService';

const mapLenderTypeEnum = (type?: string): LenderType => {
  if (!type) return 'NBFC';
  const t = String(type).toUpperCase().replace(/\s+/g, '_');
  if (t === 'BANK') return 'BANK';
  if (t === 'FINANCIAL_INSTITUTION' || t === 'MONEY_FINANCER' || t === 'FINANCER') return 'FINANCIAL_INSTITUTION';
  if (t === 'INDIVIDUAL') return 'INDIVIDUAL';
  return 'NBFC';
};

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
    successRate,
    avatarUrl,
    logoUrl,
  } = req.body;

  let parsedLat = latitude !== undefined && latitude !== null && !isNaN(Number(latitude)) ? parseFloat(String(latitude)) : undefined;
  let parsedLng = longitude !== undefined && longitude !== null && !isNaN(Number(longitude)) ? parseFloat(String(longitude)) : undefined;
  const parsedRadius = lendingRadiusKm !== undefined && lendingRadiusKm !== null && !isNaN(Number(lendingRadiusKm)) ? parseFloat(String(lendingRadiusKm)) : undefined;

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

  if (parsedLat === undefined || parsedLng === undefined) {
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
      institutionType: institutionType ? mapLenderTypeEnum(institutionType) : undefined,
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
      successRate: successRate || undefined,
      avatarUrl: effectiveAvatar,
      logoUrl: effectiveAvatar,
    },
    create: {
      userId: userId!,
      institutionName: financerName || 'Business Money Financer',
      institutionType: mapLenderTypeEnum(institutionType),
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
      successRate: successRate || '80% - 90%',
      avatarUrl: effectiveAvatar,
      logoUrl: effectiveAvatar,
    },
  });

  // Real-time broadcast lender profile update to all vendors and admin
  emitToRole('VENDOR', 'lender:updated', { lender: profile });
  emitToAdmin('lender:updated', { lender: profile });

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
      userId: v.userId,
      vendorName: v.ownerName || (v.user?.email ? v.user.email.split('@')[0] : 'Business Owner'),
      ownerName: v.ownerName || (v.user?.email ? v.user.email.split('@')[0] : 'Business Owner'),
      shopName: v.businessName || `${v.ownerName || 'Business'} Enterprise`,
      businessName: v.businessName || `${v.ownerName || 'Business'} Enterprise`,
      category: v.category || 'Retail Shop',
      annualTurnover: v.annualTurnover || '10-50 Lakhs',
      monthlyIncome: '₹ 50,000 / month',
      address: v.address || `${v.place || 'Commercial Area'}, ${v.city || 'Hyderabad'}`,
      place: v.place || 'Commercial Area',
      city: v.city || 'Hyderabad',
      state: v.state || 'Telangana',
      country: v.country || 'India',
      pincode: v.pincode,
      latitude: vLat,
      longitude: vLng,
      distanceKm,
      isWithinRadius,
      lendingRadiusKm: lenderRadiusKm,
      mobileNumber: v.user?.phone || 'Not provided',
      emailId: v.user?.email || 'vendor@justpaisa.com',
      isFraud: !!v.isFraud,
      panNumber: null, // Redacted for discovery security
      aadhaarNumber: null, // Redacted for discovery security
      gstNumber: null, // Redacted for discovery security
      kycStatus: v.kycStatus,
      avatarUrl: v.avatarUrl || v.logoUrl || null,
      panFileUrl: null, // Redacted for discovery security
      aadhaarFileUrl: null, // Redacted for discovery security
      shopLicensePdf: null, // Redacted for discovery security
      gstCertificatePdf: null, // Redacted for discovery security
      shopPhotoUrl: (v as any).shopPhotos ? (() => { try { const p = JSON.parse((v as any).shopPhotos); return p[0] || null; } catch { return null; } })() : (v.logoUrl || v.avatarUrl || null),
      shopPhotos: (v as any).shopPhotos ? (() => { try { return JSON.parse((v as any).shopPhotos); } catch { return []; } })() : (v.avatarUrl ? [v.avatarUrl] : []),
      liveSelfieUrl: v.avatarUrl || null,
      kycDocuments: [], // Redacted for discovery security
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

    let finalVendorId = vendorId;
    let dbVendorProfile: any = null;

    // 1. Resolve vendor profile from authenticated user session
    if (req.user?.userId) {
      dbVendorProfile = await prisma.vendorProfile.findUnique({
        where: { userId: req.user.userId },
        include: { user: true },
      });
      if (dbVendorProfile) finalVendorId = dbVendorProfile.id;
    }

    // 2. Resolve vendor profile by email if not found
    let snap: any = {};
    try {
      if (vendorSnapshot) {
        snap = typeof vendorSnapshot === 'string' ? JSON.parse(vendorSnapshot) : vendorSnapshot;
      }
    } catch {}

    if (!dbVendorProfile && snap.emailId) {
      const u = await prisma.user.findUnique({
        where: { email: snap.emailId },
        include: { vendorProfile: true },
      });
      if (u?.vendorProfile) {
        dbVendorProfile = u.vendorProfile;
        finalVendorId = dbVendorProfile.id;
      }
    }

    if (dbVendorProfile?.isFraud) {
      return res.status(403).json({
        success: false,
        message: '🚨 Account Restricted: Your account is flagged as Fraud / Blacklisted by Admin. Loan applications and financing requests are restricted.',
      });
    }

    // 3. Merge verified cloud-hosted document URLs from database into snapshot so all documents are complete
    if (dbVendorProfile) {
      snap.vendorName = snap.vendorName || dbVendorProfile.ownerName;
      snap.shopName = snap.shopName || dbVendorProfile.businessName;
      snap.shopAddress = snap.shopAddress || dbVendorProfile.address;
      snap.city = snap.city || dbVendorProfile.city;
      snap.state = snap.state || dbVendorProfile.state;
      snap.panNumber = snap.panNumber || dbVendorProfile.panNumber;
      snap.aadhaarNumber = snap.aadhaarNumber || dbVendorProfile.aadhaarNumber;
      snap.gstNumber = snap.gstNumber || dbVendorProfile.gstNumber;
      snap.panFileUrl = snap.panFileUrl || dbVendorProfile.panFileUrl || null;
      snap.aadhaarFileUrl = snap.aadhaarFileUrl || dbVendorProfile.aadhaarFileUrl || null;
      snap.shopLicensePdf = snap.shopLicensePdf || dbVendorProfile.businessLicenseUrl || null;
      snap.gstCertificatePdf = snap.gstCertificatePdf || dbVendorProfile.gstFileUrl || null;
      snap.avatarUrl = snap.avatarUrl || dbVendorProfile.avatarUrl || null;
      snap.annualIncome = snap.annualIncome || dbVendorProfile.annualTurnover;
      snap.annualTurnover = snap.annualTurnover || dbVendorProfile.annualTurnover;

      if (!snap.shopPhotoUrl && dbVendorProfile.shopPhotos) {
        try {
          const arr = typeof dbVendorProfile.shopPhotos === 'string' ? JSON.parse(dbVendorProfile.shopPhotos) : dbVendorProfile.shopPhotos;
          if (Array.isArray(arr) && arr.length > 0) {
            snap.shopPhotoUrl = arr[0];
            snap.shopImages = arr;
          }
        } catch {}
      }
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
        vendorId: finalVendorId || null,
        type: leadType,
        status: 'Pending',
        amount: amount ? parseFloat(String(amount)) : null,
        purpose: purpose || null,
        notes: leadNotes,
        vendorSnapshot: JSON.stringify(snap),
      },
      include: {
        vendor: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            ownerName: true,
            annualTurnover: true,
            category: true,
            city: true,
            state: true,
            address: true,
            isFraud: true,
            avatarUrl: true,
            panFileUrl: true,
            aadhaarFileUrl: true,
            businessLicenseUrl: true,
            gstFileUrl: true,
            shopPhotos: true,
            user: { select: { email: true, phone: true, isVerified: true } },
          },
        },
      },
    });

    // Real-time broadcast to lender's private room & admin room
    try {
      const targetLender = await prisma.lenderProfile.findFirst({
        where: {
          OR: [
            { id: lenderId },
            { userId: lenderId },
            { registrationNumber: lenderId },
            { institutionName: lenderId },
          ],
        },
        select: { userId: true, id: true, institutionName: true },
      });

      if (targetLender?.userId) {
        emitToUser(targetLender.userId, 'lead:new', lead);
      }
      emitToUser(lenderId, 'lead:new', lead);
      emitToAdmin('lead:new', lead);
    } catch (socketErr) {
      console.warn('Socket broadcast error in ingestLead:', socketErr);
    }

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
          { lenderId: lenderProfile.userId },
          { lenderId: lenderProfile.registrationNumber },
          { lenderId: lenderProfile.institutionName },
          { lenderId: { contains: lenderProfile.institutionName, mode: 'insensitive' } },
        ],
      },
      include: {
        vendor: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            ownerName: true,
            annualTurnover: true,
            category: true,
            city: true,
            state: true,
            address: true,
            isFraud: true,
            avatarUrl: true,
            panFileUrl: true,
            aadhaarFileUrl: true,
            businessLicenseUrl: true,
            gstFileUrl: true,
            shopPhotos: true,
            user: { select: { email: true, phone: true, isVerified: true } },
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

    const existingLead = await (prisma as any).financingLead.findUnique({
      where: { id: leadId },
      include: {
        vendor: { select: { userId: true } },
      },
    });

    const lead = await (prisma as any).financingLead.update({
      where: { id: leadId },
      data: { status },
      include: {
        vendor: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            ownerName: true,
            user: { select: { email: true, phone: true } },
          },
        },
      },
    });

    // Real-time broadcast: notify vendor of status update instantly without refresh
    try {
      if (existingLead?.vendor?.userId) {
        emitToUser(existingLead.vendor.userId, 'lead:status_updated', {
          leadId,
          status,
          lead,
        });
      }
      emitToAdmin('lead:status_updated', { leadId, status, lead });
    } catch (socketErr) {
      console.warn('Socket broadcast error in updateLeadStatus:', socketErr);
    }

    res.json({
      success: true,
      message: `Lead status updated to ${status}.`,
      data: lead,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to update lead status.' });
  }
};

export const deleteLead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { leadId } = req.params;

    const existingLead = await (prisma as any).financingLead.findUnique({
      where: { id: leadId },
      include: {
        vendor: { select: { userId: true } },
      },
    });

    await (prisma as any).financingLead.deleteMany({
      where: {
        id: leadId,
      },
    });

    // Real-time broadcast deletion
    try {
      if (existingLead?.vendor?.userId) {
        emitToUser(existingLead.vendor.userId, 'lead:deleted', { leadId });
      }
      emitToAdmin('lead:deleted', { leadId });
    } catch (socketErr) {
      console.warn('Socket broadcast error in deleteLead:', socketErr);
    }

    res.json({
      success: true,
      message: 'Financing request deleted successfully.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Failed to delete financing request.' });
  }
};


