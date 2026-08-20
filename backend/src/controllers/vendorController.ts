import { Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';
import { calculateDistanceKm } from '../utils/distance';

export const updateVendorProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const {
    businessName,
    ownerName,
    gstNumber,
    panNumber,
    registrationType,
    annualTurnover,
    category,
    address,
    place,
    city,
    state,
    country,
    pincode,
    latitude,
    longitude,
  } = req.body;

  const parsedLat = latitude !== undefined && latitude !== null ? parseFloat(String(latitude)) : undefined;
  const parsedLng = longitude !== undefined && longitude !== null ? parseFloat(String(longitude)) : undefined;

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
      place,
      city,
      state,
      country: country || 'India',
      pincode,
      latitude: parsedLat,
      longitude: parsedLng,
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
      place: place || 'Commercial Center',
      city: city || 'Mumbai',
      state: state || 'Maharashtra',
      country: country || 'India',
      pincode: pincode || '400001',
      latitude: parsedLat ?? 19.0760,
      longitude: parsedLng ?? 72.8777,
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
  const { query, city, category, institutionType, userLat, userLng } = req.query;

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

  // 2. Fetch All Valid Lenders (All verified/active financer accounts)
  const lenders = await prisma.lenderProfile.findMany({
    where: {
      verificationStatus: { not: 'REJECTED' },
      institutionType: institutionType ? (String(institutionType) as any) : undefined,
    },
    include: {
      user: {
        select: { email: true, phone: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Default coordinate fallback: Hyderabad or Mumbai
  const parsedLat = userLat ? parseFloat(String(userLat)) : 17.3850;
  const parsedLng = userLng ? parseFloat(String(userLng)) : 78.4867;

  // 3. Format, calculate distance, and strictly filter by Lender's Service Radius
  let formattedLenders = lenders
    .map((lender) => {
      const categoriesArray: string[] = JSON.parse(lender.loanCategories || '[]');
      const distanceKm = calculateDistanceKm(parsedLat, parsedLng, lender.latitude, lender.longitude);
      const configuredRadius = lender.lendingRadiusKm || 50.0;
      const isWithinRadius = distanceKm <= configuredRadius;

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
        place: lender.place || 'Financial District',
        city: lender.city,
        state: lender.state,
        country: lender.country || 'India',
        pincode: lender.pincode,
        latitude: lender.latitude,
        longitude: lender.longitude,
        lendingRadiusKm: configuredRadius,
        contactPersonName: lender.contactPersonName,
        rating: lender.rating,
        reviewCount: lender.reviewCount,
        distanceKm,
        isWithinRadius,
        // Locked/Unlocked status
        contactUnlocked: hasActiveSubscription,
        phone: hasActiveSubscription ? rawPhone : maskedPhone,
        email: hasActiveSubscription ? lender.user?.email : maskedEmail,
        whatsAppUrl: hasActiveSubscription
          ? `https://wa.me/91${rawPhone}?text=${encodeURIComponent('Hello, I discovered your institution on Just Paisa App and would like to discuss lending requirements.')}`
          : null,
      };
    })
    // Strict geographic radius match: Show lender only if vendor's search location is within lender's radius
    .filter((l) => l.isWithinRadius);

  // Filter by search query if provided (Institution name, category, city, place)
  if (query) {
    const q = String(query).toLowerCase();
    formattedLenders = formattedLenders.filter(
      (l) =>
        l.institutionName.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        (l.place && l.place.toLowerCase().includes(q)) ||
        l.loanCategories.some((cat) => cat.toLowerCase().includes(q))
    );
  }

  // Filter by city if explicitly passed
  if (city) {
    const c = String(city).toLowerCase();
    formattedLenders = formattedLenders.filter(
      (l) => l.city.toLowerCase().includes(c) || (l.place && l.place.toLowerCase().includes(c))
    );
  }

  // Filter by category if provided
  if (category) {
    const catStr = String(category).toLowerCase();
    formattedLenders = formattedLenders.filter((l) =>
      l.loanCategories.some((c) => c.toLowerCase().includes(catStr))
    );
  }

  // Sort by nearest distance first
  formattedLenders.sort((a, b) => a.distanceKm - b.distanceKm);

  res.json({
    success: true,
    hasActiveSubscription,
    searchCoordinates: { latitude: parsedLat, longitude: parsedLng },
    totalCount: formattedLenders.length,
    data: formattedLenders,
  });
};
