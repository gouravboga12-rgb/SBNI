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

// Helper to resolve effective lender coordinates based on address & city
function getEffectiveLenderCoordinates(lender: any): { lat: number; lng: number } {
  const rawLat = lender.latitude !== undefined && lender.latitude !== null ? Number(lender.latitude) : 17.3850;
  const rawLng = lender.longitude !== undefined && lender.longitude !== null ? Number(lender.longitude) : 78.4867;
  
  const isDefaultMumbai = Math.abs(rawLat - 19.076) < 0.01 && Math.abs(rawLng - 72.8777) < 0.01;
  const addressText = `${lender.address || ''} ${lender.place || ''} ${lender.city || ''} ${lender.state || ''}`.toLowerCase();

  if (isDefaultMumbai) {
    if (addressText.includes('hyderabad') || addressText.includes('telangana') || addressText.includes('kothapet') || addressText.includes('chaitanyapuri') || addressText.includes('secunderabad')) {
      return { lat: 17.3850, lng: 78.4867 };
    }
    if (addressText.includes('delhi') || addressText.includes('ncr') || addressText.includes('gurgaon') || addressText.includes('noida')) {
      return { lat: 28.6139, lng: 77.2090 };
    }
    if (addressText.includes('bangalore') || addressText.includes('bengaluru') || addressText.includes('karnataka')) {
      return { lat: 12.9716, lng: 77.5946 };
    }
    if (addressText.includes('chennai') || addressText.includes('tamil nadu')) {
      return { lat: 13.0827, lng: 80.2707 };
    }
    if (addressText.includes('pune') || addressText.includes('maharashtra')) {
      return { lat: 18.5204, lng: 73.8567 };
    }
    if (addressText.includes('kolkata') || addressText.includes('bengal')) {
      return { lat: 22.5726, lng: 88.3639 };
    }
    if (addressText.includes('vijayawada') || addressText.includes('andhra')) {
      return { lat: 16.5062, lng: 80.6480 };
    }
  }

  return { lat: rawLat, lng: rawLng };
}

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

  // Default coordinate fallback: Hyderabad
  const parsedLat = userLat ? parseFloat(String(userLat)) : 17.3850;
  const parsedLng = userLng ? parseFloat(String(userLng)) : 78.4867;

  // 3. Format, calculate distance, and match by Lender's Service Radius
  let formattedLenders = lenders.map((lender) => {
    let categoriesArray: string[] = ['Business Loan', 'Working Capital Loan'];
    try {
      if (lender.loanCategories) {
        const parsed = JSON.parse(lender.loanCategories);
        if (Array.isArray(parsed)) categoriesArray = parsed;
      }
    } catch {}

    const { lat: effLat, lng: effLng } = getEffectiveLenderCoordinates(lender);
    const distanceKm = calculateDistanceKm(parsedLat, parsedLng, effLat, effLng);
    const configuredRadius = lender.lendingRadiusKm || 50.0;
    const isWithinRadius = distanceKm <= configuredRadius;

    // Dynamic contact masking if not subscribed
    const rawPhone = lender.user?.phone || '9820000000';
    const maskedPhone = rawPhone.substring(0, 3) + '******' + rawPhone.substring(rawPhone.length - 2);
    const maskedEmail = lender.user?.email ? lender.user.email.replace(/(.{2})(.*)(?=@)/, '$1***') : 'contact***@lender.com';

    let formattedInstName = lender.institutionName || 'Business Money Financer';
    if (!formattedInstName.toLowerCase().includes('money financer')) {
      formattedInstName = `${formattedInstName} Money Financer`;
    }

    return {
      id: lender.id,
      institutionName: formattedInstName,
      institutionType: lender.institutionType,
      logoUrl: (lender as any).logoUrl || (lender as any).avatarUrl || undefined,
      avatarUrl: (lender as any).avatarUrl || (lender as any).logoUrl || undefined,
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
      latitude: effLat,
      longitude: effLng,
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
  });

  // Sort by nearest distance first
  formattedLenders.sort((a, b) => a.distanceKm - b.distanceKm);

  // Strict radius filtering: If we have matches in current radius, use them.
  // Otherwise, provide all verified lenders sorted by distance so the screen is never empty.
  const radiusMatched = formattedLenders.filter((l) => l.isWithinRadius);
  if (radiusMatched.length > 0) {
    formattedLenders = radiusMatched;
  }

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
