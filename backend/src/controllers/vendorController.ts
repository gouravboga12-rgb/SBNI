import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { calculateDistanceKm } from '../utils/distance';

export const updateVendorProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { businessName, ownerName, gstNumber, panNumber, registrationType, annualTurnover, category, address, city, state, pincode, latitude, longitude } = req.body;

  const profile = await prisma.vendorProfile.upsert({
    where: { userId },
    update: {
      businessName,
      ownerName,
      gstNumber,
      panNumber,
      registrationType,
      annualTurnover,
      category,
      address,
      city,
      state,
      pincode,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
    },
    create: {
      userId: userId!,
      businessName: businessName || 'My Enterprise Business',
      ownerName: ownerName || 'Business Owner',
      gstNumber,
      panNumber,
      registrationType: registrationType || 'Proprietorship',
      annualTurnover: annualTurnover || '10-50 Lakhs',
      category: category || 'Retail',
      address: address || 'Default Address',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      pincode: pincode || '400001',
      latitude: latitude ? parseFloat(latitude) : 19.0760,
      longitude: longitude ? parseFloat(longitude) : 72.8777,
    },
  });

  res.json({ success: true, message: 'Vendor business profile updated successfully.', data: profile });
};

export const uploadKYCDocument = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { docType, documentNumber, fileUrl } = req.body;

  if (!docType || !documentNumber || !fileUrl) {
    return res.status(400).json({ success: false, message: 'Document type, number, and file URL are required.' });
  }

  const document = await prisma.kYCDocument.create({
    data: {
      userId: userId!,
      docType,
      documentNumber,
      fileUrl,
      status: 'PENDING',
    },
  });

  res.status(201).json({ success: true, message: 'KYC Document submitted for verification.', data: document });
};

export const searchLenders = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { query, city, category, institutionType, minAmount, maxAmount, radiusKm, userLat, userLng } = req.query;

  // 1. Check if requesting user has an ACTIVE subscription
  let hasActiveSubscription = false;
  if (userId) {
    const activeSub = await prisma.userSubscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        endDate: { gte: new Date() },
      },
    });
    if (activeSub) {
      hasActiveSubscription = true;
    }
  }

  // 2. Fetch All Valid Lenders (All non-rejected financer accounts)
  const lenders = await prisma.lenderProfile.findMany({
    where: {
      verificationStatus: { not: 'REJECTED' },
      city: city ? { contains: String(city), mode: 'insensitive' } : undefined,
      institutionType: institutionType ? (String(institutionType) as any) : undefined,
    },
    include: {
      user: {
        select: { email: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const parsedLat = userLat ? parseFloat(String(userLat)) : 19.0760;
  const parsedLng = userLng ? parseFloat(String(userLng)) : 72.8777;
  const parsedRadius = radiusKm ? parseFloat(String(radiusKm)) : 500;

  // 3. Format and apply Gating & Distance Calculation
  let formattedLenders = lenders.map((lender) => {
    const categoriesArray: string[] = JSON.parse(lender.loanCategories || '[]');
    const distanceKm = calculateDistanceKm(parsedLat, parsedLng, lender.latitude, lender.longitude);

    // Dynamic contact masking if not subscribed
    const rawPhone = lender.user?.phone || '9820000000';
    const maskedPhone = rawPhone.substring(0, 3) + '******' + rawPhone.substring(rawPhone.length - 2);
    const maskedEmail = lender.user?.email.replace(/(.{2})(.*)(?=@)/, '$1***') || 'contact***@lender.com';

    return {
      id: lender.id,
      institutionName: lender.institutionName,
      institutionType: lender.institutionType,
      registrationNumber: lender.registrationNumber,
      loanCategories: categoriesArray,
      minLoanAmount: lender.minLoanAmount,
      maxLoanAmount: lender.maxLoanAmount,
      minInterestRate: lender.minInterestRate,
      address: lender.address,
      city: lender.city,
      state: lender.state,
      pincode: lender.pincode,
      latitude: lender.latitude,
      longitude: lender.longitude,
      contactPersonName: lender.contactPersonName,
      rating: lender.rating,
      reviewCount: lender.reviewCount,
      distanceKm,
      // Locked/Unlocked status
      contactUnlocked: hasActiveSubscription,
      phone: hasActiveSubscription ? rawPhone : maskedPhone,
      email: hasActiveSubscription ? lender.user?.email : maskedEmail,
      whatsAppUrl: hasActiveSubscription
        ? `https://wa.me/91${rawPhone}?text=${encodeURIComponent('Hello, I discovered your institution on SBNI Money App and would like to discuss lending requirements.')}`
        : null,
    };
  });

  // Filter by search query if provided
  if (query) {
    const q = String(query).toLowerCase();
    formattedLenders = formattedLenders.filter(
      (l) =>
        l.institutionName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.loanCategories.some((cat) => cat.toLowerCase().includes(q))
    );
  }

  // Filter by category if provided
  if (category) {
    const catStr = String(category).toLowerCase();
    formattedLenders = formattedLenders.filter((l) =>
      l.loanCategories.some((c) => c.toLowerCase().includes(catStr))
    );
  }

  // Filter by radius
  formattedLenders = formattedLenders.filter((l) => l.distanceKm <= parsedRadius);

  // Sort by distance ascending
  formattedLenders.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({
    success: true,
    hasActiveSubscription,
    totalCount: formattedLenders.length,
    data: formattedLenders,
  });
};
