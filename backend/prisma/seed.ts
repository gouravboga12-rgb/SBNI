import { PrismaClient, Role, KYCStatus, LenderType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting SBNI Money App Database Seed...');

  // 1. Password hash for default accounts
  const defaultPasswordHash = await bcrypt.hash('SBNIMoney@2026', 10);
  const adminPasswordHash = await bcrypt.hash('Srinivas@10', 10);

  // 2. Super Admin Account
  const adminUser = await prisma.user.upsert({
    where: { email: 'srinivaspolepalli10@gmail.com' },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    },
    create: {
      email: 'srinivaspolepalli10@gmail.com',
      phone: '9876543210',
      passwordHash: adminPasswordHash,
      role: Role.SUPER_ADMIN,
      isVerified: true,
    },
  });
  console.log('✅ Super Admin created:', adminUser.email);

  // 3. Sample Subscriptions Plans (Weekly, Monthly, Quarterly, Half-Yearly, Yearly)
  const plans = [
    {
      code: 'WEEKLY',
      name: 'Weekly Trial Plan',
      description: 'Unlock lender contacts & WhatsApp connect for 7 days',
      price: 299,
      originalPrice: 499,
      durationDays: 7,
      isPopular: false,
      features: JSON.stringify([
        'Unlock Verified Lender Phone Numbers',
        'Direct WhatsApp Chat Access',
        'Location Radius Discovery (Up to 25 km)',
        'In-App Notification Alerts',
      ]),
    },
    {
      code: 'MONTHLY',
      name: 'Monthly Growth Plan',
      description: 'Ideal for active business owners seeking capital',
      price: 899,
      originalPrice: 1499,
      durationDays: 30,
      isPopular: true,
      features: JSON.stringify([
        'Unlimited Verified Lender Phone Unlocks',
        'Direct WhatsApp & Email Access',
        'Pan-India Lender Discovery',
        'Priority KYC Verification Tag',
        'Dedicated Support Assistance',
      ]),
    },
    {
      code: 'QUARTERLY',
      name: 'Quarterly Value Plan',
      description: '90 days of continuous access with 25% savings',
      price: 2299,
      originalPrice: 3499,
      durationDays: 90,
      isPopular: false,
      features: JSON.stringify([
        'Unlimited Lender Unlocks for 3 Months',
        'WhatsApp & Direct Calling Unlocked',
        'Priority Business Profile Listing',
        'Direct Institution Inquiry Access',
        'Full Invoice & Tax Support',
      ]),
    },
    {
      code: 'HALF_YEARLY',
      name: 'Half-Yearly Business Plan',
      description: '6 months access for expanding enterprises',
      price: 3999,
      originalPrice: 6999,
      durationDays: 180,
      isPopular: false,
      features: JSON.stringify([
        '6 Months Access to All Verified Lenders',
        'Instant Document Sharing with Lenders',
        'VIP Badge on Vendor Profile',
        'Exclusive Direct NBFC & Bank Directory',
      ]),
    },
    {
      code: 'YEARLY',
      name: 'Annual Enterprise Plan',
      description: '365 days of full marketplace access with maximum savings',
      price: 6999,
      originalPrice: 12999,
      durationDays: 365,
      isPopular: false,
      features: JSON.stringify([
        '1 Full Year of Unlimited Marketplace Access',
        'All Features Unlocked Forever',
        'Personal Relationship Manager Support',
        'Custom Loan Requirement Broadcast to 100+ Lenders',
      ]),
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Subscription plans seeded.');

  // 4. Sample Banners
  const banners = [
    {
      title: 'Direct Lender Discovery for Business Owners',
      subtitle: 'Connect directly with verified Banks & NBFCs across India. Zero loan middleman commission.',
      imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?q=80&w=1200',
      actionUrl: '/lenders',
      targetAudience: 'VENDOR',
      displayOrder: 1,
    },
    {
      title: 'Expand Your Loan Portfolio across Verified Businesses',
      subtitle: 'Showcase your NBFC and Bank lending options to thousands of verified vendors.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200',
      actionUrl: '/register-lender',
      targetAudience: 'LENDER',
      displayOrder: 2,
    },
  ];

  for (const b of banners) {
    await prisma.banner.create({ data: b });
  }
  console.log('✅ Banners seeded.');

  // 5. Sample FAQs
  const faqs = [
    {
      category: 'General',
      question: 'What is SBNI Money App?',
      answer: 'SBNI Money App is India’s premier B2B Loan Marketplace that connects Business Owners (Vendors) with verified Banks, NBFCs, and Lenders. We facilitate direct discovery and communication.',
      displayOrder: 1,
    },
    {
      category: 'General',
      question: 'Does SBNI Money process or approve my loan?',
      answer: 'No. SBNI Money is strictly a marketplace platform. We do not process, approve, disburse, or track loans. All negotiations, documentation, and loan disbursements take place directly between you and the verified lender.',
      displayOrder: 2,
    },
    {
      category: 'Subscriptions',
      question: 'Why do I need a subscription plan?',
      answer: 'Subscription plans unlock direct lender phone numbers, WhatsApp links, and verified contact details, allowing business owners to connect directly with financial institutions without intermediaries.',
      displayOrder: 3,
    },
    {
      category: 'Verification',
      question: 'How are lenders verified on SBNI Money?',
      answer: 'Every Bank, NBFC, and financial institution undergoes strict digital KYC, license verification, and registration audits before being displayed on the platform.',
      displayOrder: 4,
    },
  ];

  for (const faq of faqs) {
    await prisma.fAQ.create({ data: faq });
  }
  console.log('✅ FAQs seeded.');

  // 6. Sample CMS Pages
  const cmsPages = [
    {
      pageKey: 'terms',
      title: 'Terms of Service',
      content: '<h2>1. Acceptance of Terms</h2><p>By accessing SBNI Money App, you agree to comply with our Terms. SBNI Money operates purely as a discovery and networking marketplace between Vendors and Lenders.</p><h2>2. No Financial Advice or Loan Approval</h2><p>SBNI Money does not issue loan approvals, compute credit scores, or collect loan repayments.</p>',
      metaTitle: 'Terms of Service - SBNI Money App',
      metaDescription: 'Read the terms of service for SBNI Money B2B Loan Marketplace.',
    },
    {
      pageKey: 'privacy',
      title: 'Privacy Policy',
      content: '<h2>Privacy & Data Security</h2><p>Your privacy is important to us. All documents uploaded for KYC are encrypted with bank-grade encryption protocols.</p>',
      metaTitle: 'Privacy Policy - SBNI Money App',
      metaDescription: 'Learn how SBNI Money protects your business data and privacy.',
    },
  ];

  for (const page of cmsPages) {
    await prisma.cMSPage.upsert({
      where: { pageKey: page.pageKey },
      update: page,
      create: page,
    });
  }
  console.log('✅ CMS Pages seeded.');

  // 7. Sample Testimonials
  const testimonials = [
    {
      authorName: 'Rajesh Sharma',
      authorRole: 'Founder & CEO',
      companyName: 'Sharma Textile Exports',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200',
      rating: 5,
      quote: 'SBNI Money helped us discover 4 nearby NBFCs in Mumbai. We unlocked contact details and secured our working capital facility within 3 days directly with the lender!',
      displayOrder: 1,
    },
    {
      authorName: 'Priya Patel',
      authorRole: 'Managing Director',
      companyName: 'Patel Precision Polymers',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200',
      rating: 5,
      quote: 'Transparent subscription model with zero hidden commissions. Getting direct access to verified bank officers changed our expansion strategy completely.',
      displayOrder: 2,
    },
  ];

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t });
  }
  console.log('✅ Testimonials seeded.');

  // 8. Sample Coupons
  await prisma.coupon.upsert({
    where: { code: 'WELCOME10' },
    update: {},
    create: {
      code: 'WELCOME10',
      discountPercentage: 10,
      maxDiscountAmount: 500,
      minPurchaseAmount: 500,
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      usageLimit: 500,
    },
  });
  console.log('✅ Coupons seeded.');

  // 9. Platform Settings
  const settings = [
    { key: 'SITE_NAME', value: 'SBNI Money App', group: 'General', description: 'Platform Name' },
    { key: 'SUPPORT_EMAIL', value: 'support@sbnimoney.com', group: 'Contact', description: 'Support Email Address' },
    { key: 'SUPPORT_PHONE', value: '+91 1800 123 4567', group: 'Contact', description: 'Toll Free Customer Care' },
    { key: 'WHATSAPP_SUPPORT', value: '+91 98765 43210', group: 'Contact', description: 'WhatsApp Help Desk' },
    { key: 'TAX_PERCENTAGE', value: '18', group: 'Payment', description: 'GST Percentage applied on subscriptions' },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: s,
      create: s,
    });
  }

  // 10. Sample Verified Lenders
  const lenderUser1 = await prisma.user.upsert({
    where: { email: 'contact@capitalgrowthnbfc.com' },
    update: {},
    create: {
      email: 'contact@capitalgrowthnbfc.com',
      phone: '9820011223',
      passwordHash: defaultPasswordHash,
      role: Role.LENDER,
      isVerified: true,
    },
  });

  await prisma.lenderProfile.upsert({
    where: { userId: lenderUser1.id },
    update: {},
    create: {
      userId: lenderUser1.id,
      institutionName: 'Nishanth Finance',
      institutionType: LenderType.NBFC,
      registrationNumber: 'FIN-IND-2021-1001',
      loanCategories: JSON.stringify(['Business Loan', 'MSME Working Capital', 'Machinery Loan']),
      minLoanAmount: 200000,
      maxLoanAmount: 25000000,
      minInterestRate: 9.5,
      address: 'BKC Financial District, Bandra East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400051',
      latitude: 19.0674,
      longitude: 72.8687,
      contactPersonName: 'Nishanth Kumar (Proprietor)',
      verificationStatus: KYCStatus.VERIFIED,
      rating: 4.9,
      reviewCount: 38,
    },
  });

  const lenderUser2 = await prisma.user.upsert({
    where: { email: 'loans@rajeshfinance.in' },
    update: {},
    create: {
      email: 'loans@rajeshfinance.in',
      phone: '9833344556',
      passwordHash: defaultPasswordHash,
      role: Role.LENDER,
      isVerified: true,
    },
  });

  await prisma.lenderProfile.upsert({
    where: { userId: lenderUser2.id },
    update: {},
    create: {
      userId: lenderUser2.id,
      institutionName: 'Rajesh Finance',
      institutionType: LenderType.NBFC,
      registrationNumber: 'FIN-IND-2019-1002',
      loanCategories: JSON.stringify(['Commercial Loan', 'Letter of Credit', 'Export Finance', 'MSME Loan']),
      minLoanAmount: 500000,
      maxLoanAmount: 100000000,
      minInterestRate: 8.25,
      address: 'Connaught Place Commercial Hub',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      latitude: 28.6315,
      longitude: 77.2167,
      contactPersonName: 'Rajesh Sharma (Managing Director)',
      verificationStatus: KYCStatus.VERIFIED,
      rating: 4.8,
      reviewCount: 54,
    },
  });

  console.log('✅ Sample Verified Lenders created.');

  // 11. Sample Vendor Demo Account
  const vendorUser1 = await prisma.user.upsert({
    where: { email: 'rajesh@sharmatextiles.com' },
    update: {},
    create: {
      email: 'rajesh@sharmatextiles.com',
      phone: '9820099887',
      passwordHash: defaultPasswordHash,
      role: Role.VENDOR,
      isVerified: true,
    },
  });

  await prisma.vendorProfile.upsert({
    where: { userId: vendorUser1.id },
    update: {},
    create: {
      userId: vendorUser1.id,
      businessName: 'Sharma Textile Exports',
      ownerName: 'Rajesh Sharma',
      annualTurnover: '50L - 1Cr',
      category: 'Retail & Garments',
      address: 'Shop No 42, Textile Market, Lower Parel',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400013',
      kycStatus: KYCStatus.VERIFIED,
    },
  });

  console.log('✅ Sample Vendor created:', vendorUser1.email);
  console.log('🎉 SBNI Money Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Database seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
