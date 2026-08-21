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

  // 3. Subscription Plans (Vendor & Lender)
  const plans = [
    // --- VENDOR PLANS ---
    {
      code: 'VENDOR_WEEKLY',
      name: 'Weekly Starter Plan',
      description: 'Start exploring nearby business financers',
      price: 79,
      originalPrice: 99,
      durationDays: 7,
      isPopular: false,
      isBestValue: false,
      roleTarget: 'VENDOR',
      isActive: true,
      features: JSON.stringify([
        'Unlock up to 5 Financer Contacts',
        'Direct Phone & WhatsApp Access',
        'Verified Financer Trust Badge',
        'Dedicated Help Desk Support',
      ]),
    },
    {
      code: 'VENDOR_MONTHLY',
      name: 'Monthly Growth Plan',
      description: 'Most popular plan for small shop businesses seeking capital',
      price: 199,
      originalPrice: 299,
      durationDays: 30,
      isPopular: true,
      isBestValue: true,
      roleTarget: 'VENDOR',
      isActive: true,
      features: JSON.stringify([
        'Unlimited Financer Phone & WhatsApp Unlocks',
        'Direct Email & Branch Contact Access',
        'Pan-India Financer Discovery',
        'Priority Application Routing',
        'Dedicated Account Manager',
      ]),
    },
    {
      code: 'VENDOR_QUARTERLY',
      name: 'Quarterly Business Plan',
      description: '3 Months uninterrupted financer discovery suite',
      price: 349,
      originalPrice: 499,
      durationDays: 90,
      isPopular: false,
      isBestValue: false,
      roleTarget: 'VENDOR',
      isActive: true,
      features: JSON.stringify([
        'Everything in Monthly Growth Plan',
        'Priority KYC Document Storage',
        'Multi-Financer Rate Comparison Tool',
        'New Financer Instant Alerts',
      ]),
    },
    {
      code: 'VENDOR_YEARLY',
      name: 'Yearly VIP Enterprise Plan',
      description: '1 Year complete access with maximum savings',
      price: 599,
      originalPrice: 999,
      durationDays: 365,
      isPopular: false,
      isBestValue: true,
      roleTarget: 'VENDOR',
      isActive: true,
      features: JSON.stringify([
        '365 Days Unlimited Contact Access',
        'Zero Middleman Fees Guarantee',
        'VIP Priority Verification Status',
        '24/7 Dedicated Account Manager',
      ]),
    },

    // --- LENDER (FINANCER) PLANS ---
    {
      code: 'LENDER_WEEKLY',
      name: 'Financer Weekly Starter',
      description: '7 Days trial access for business financers',
      price: 79,
      originalPrice: 99,
      durationDays: 7,
      isPopular: false,
      isBestValue: false,
      roleTarget: 'LENDER',
      isActive: true,
      features: JSON.stringify([
        'Connect with Verified Shop Businesses',
        'View Up to 10 Vendor KYC Files',
        'Direct Owner WhatsApp Link',
      ]),
    },
    {
      code: 'LENDER_MONTHLY',
      name: 'Financer Monthly Plan',
      description: 'Most popular plan for NBFCs & financial institutions',
      price: 199,
      originalPrice: 249,
      durationDays: 30,
      isPopular: true,
      isBestValue: true,
      roleTarget: 'LENDER',
      isActive: true,
      features: JSON.stringify([
        'Unlimited Verified Shop Business Leads',
        'Complete KYC & GST Report Access',
        'Direct Application Routing',
        'Lead Management Dashboard',
      ]),
    },
    {
      code: 'LENDER_QUARTERLY',
      name: 'Financer Quarterly Growth',
      description: '3 Months uninterrupted business financing suite',
      price: 399,
      originalPrice: 499,
      durationDays: 90,
      isPopular: false,
      isBestValue: false,
      roleTarget: 'LENDER',
      isActive: true,
      features: JSON.stringify([
        'Everything in Monthly Plan',
        'Priority Lead Allocation',
        'Risk & Analytics Dashboard',
        'Dedicated Relationship Support',
      ]),
    },
    {
      code: 'LENDER_ANNUAL',
      name: 'Financer Annual VIP Plan',
      description: '1 Year maximum visibility & premium leads',
      price: 599,
      originalPrice: 999,
      durationDays: 365,
      isPopular: false,
      isBestValue: true,
      roleTarget: 'LENDER',
      isActive: true,
      features: JSON.stringify([
        '365 Days Full Platform Access',
        'Unlimited Premium Lead Discovery',
        'Custom Product Promotion Listing',
        'Featured Top Badge on Financer Directory',
      ]),
    },
  ];

  // Deactivate old legacy plans
  await prisma.subscriptionPlan.updateMany({
    where: {
      code: {
        notIn: plans.map((p) => p.code),
      },
    },
    data: {
      isActive: false,
    },
  });

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
  console.log('✅ Subscription plans seeded successfully.');

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

  console.log('🎉 SBNI Money Database Seeding Completed Successfully (Zero Dummy Accounts)!');
}

main()
  .catch((e) => {
    console.error('❌ Database seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

