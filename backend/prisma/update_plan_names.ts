import prisma from '../src/config/prisma';

async function updatePlans() {
  console.log('🔄 Updating subscription plans in database to Commercial Partner terminology...');

  // Update LENDER plans
  await prisma.subscriptionPlan.updateMany({
    where: { code: 'LENDER_WEEKLY' },
    data: {
      name: 'Commercial Partner Weekly Starter',
      description: '14 Days trial access for commercial partners',
      features: JSON.stringify([
        'Connect with Verified Shop Businesses',
        'View Up to 10 Vendor KYC Files',
        'Direct Owner WhatsApp Link',
      ]),
    },
  });

  await prisma.subscriptionPlan.updateMany({
    where: { code: 'LENDER_MONTHLY' },
    data: {
      name: 'Commercial Partner Monthly Plan',
      description: 'Most popular plan for commercial partners & enterprises',
      features: JSON.stringify([
        'Unlimited Verified Shop Business Leads',
        'Complete KYC & GST Report Access',
        'Direct Application Routing',
        'Lead Management Dashboard',
      ]),
    },
  });

  await prisma.subscriptionPlan.updateMany({
    where: { code: 'LENDER_QUARTERLY' },
    data: {
      name: 'Commercial Partner Quarterly Growth',
      description: '3 Months uninterrupted business networking suite',
      features: JSON.stringify([
        'Everything in Monthly Plan',
        'Priority Lead Allocation',
        'Risk & Analytics Dashboard',
        'Dedicated Relationship Support',
      ]),
    },
  });

  await prisma.subscriptionPlan.updateMany({
    where: { code: 'LENDER_ANNUAL' },
    data: {
      name: 'Commercial Partner Annual VIP Plan',
      description: '1 Year maximum visibility & premium leads',
      features: JSON.stringify([
        '365 Days Full Platform Access',
        'Unlimited Premium Lead Discovery',
        'Custom Product Promotion Listing',
        'Featured Top Badge on Partner Directory',
      ]),
    },
  });

  // Update VENDOR plans
  await prisma.subscriptionPlan.updateMany({
    where: { code: 'VENDOR_WEEKLY' },
    data: {
      name: 'Weekly Starter Plan',
      description: 'Start exploring nearby verified commercial partners',
      features: JSON.stringify([
        'Unlock up to 5 Commercial Partner Contacts',
        'Direct Phone & WhatsApp Access',
        'Verified Commercial Partner Trust Badge',
        'Dedicated Help Desk Support',
      ]),
    },
  });

  await prisma.subscriptionPlan.updateMany({
    where: { code: 'VENDOR_MONTHLY' },
    data: {
      name: 'Monthly Growth Plan',
      description: 'Most popular plan for small shop businesses seeking commercial partnerships',
      features: JSON.stringify([
        'Unlimited Partner Phone & WhatsApp Unlocks',
        'Direct Email & Branch Contact Access',
        'Pan-India Partner Discovery',
        'Priority Application Routing',
        'Dedicated Account Manager',
      ]),
    },
  });

  await prisma.subscriptionPlan.updateMany({
    where: { code: 'VENDOR_QUARTERLY' },
    data: {
      name: 'Quarterly Business Plan',
      description: '3 Months uninterrupted commercial partner discovery suite',
      features: JSON.stringify([
        'Everything in Monthly Growth Plan',
        'Priority KYC Document Storage',
        'Multi-Partner Comparison Tool',
        'New Partner Instant Alerts',
      ]),
    },
  });

  await prisma.subscriptionPlan.updateMany({
    where: { code: 'VENDOR_YEARLY' },
    data: {
      name: 'Yearly VIP Enterprise Plan',
      description: '1 Year complete access with maximum savings',
      features: JSON.stringify([
        '365 Days Unlimited Contact Access',
        'Zero Middleman Fees Guarantee',
        'VIP Priority Verification Status',
        '24/7 Dedicated Account Manager',
      ]),
    },
  });

  // Clean any remaining legacy plans containing "financer" or "nbfc" or "lender"
  const allPlans = await prisma.subscriptionPlan.findMany();
  for (const p of allPlans) {
    let changed = false;
    let newName = p.name;
    let newDesc = p.description;
    let newFeatures = p.features;

    const sanitize = (text: string) =>
      text
        .replace(/Financer Weekly Starter/gi, 'Commercial Partner Weekly Starter')
        .replace(/Financer Monthly Plan/gi, 'Commercial Partner Monthly Plan')
        .replace(/Financer Quarterly Growth/gi, 'Commercial Partner Quarterly Growth')
        .replace(/Financer Annual VIP Plan/gi, 'Commercial Partner Annual VIP Plan')
        .replace(/Financer Directory/gi, 'Partner Directory')
        .replace(/Financers/g, 'Commercial Partners')
        .replace(/financers/g, 'commercial partners')
        .replace(/Financer/g, 'Commercial Partner')
        .replace(/financer/g, 'commercial partner')
        .replace(/NBFCs & financial institutions/gi, 'Commercial Enterprises & Partners')
        .replace(/business financing suite/gi, 'business networking suite')
        .replace(/nearby business financers/gi, 'nearby commercial partners')
        .replace(/Unlock lender contacts/gi, 'Unlock partner contacts')
        .replace(/Exclusive Direct NBFC & Bank Directory/gi, 'Exclusive Direct Partner Directory')
        .replace(/Custom Loan Requirement Broadcast to 100\+ Lenders/gi, 'Custom Requirement Broadcast to 100+ Partners');

    if (p.name && sanitize(p.name) !== p.name) {
      newName = sanitize(p.name);
      changed = true;
    }
    if (p.description && sanitize(p.description) !== p.description) {
      newDesc = sanitize(p.description);
      changed = true;
    }
    if (p.features && sanitize(p.features) !== p.features) {
      newFeatures = sanitize(p.features);
      changed = true;
    }

    if (changed) {
      await prisma.subscriptionPlan.update({
        where: { id: p.id },
        data: { name: newName, description: newDesc, features: newFeatures },
      });
      console.log(`Updated legacy plan: ${p.code} -> ${newName}`);
    }
  }

  console.log('✅ All subscription plans successfully sanitized in DB!');
}

updatePlans()
  .catch((e) => {
    console.error('Error updating plans:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
