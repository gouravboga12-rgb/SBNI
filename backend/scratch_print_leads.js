const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const users = await prisma.user.findMany({ select: { id: true, email: true, phone: true, role: true } });
  console.log('=== USERS ===');
  users.forEach(u => console.log(`${u.id} | ${u.email} | ${u.phone} | ${u.role}`));

  const leads = await prisma.financingLead.findMany({
    include: { lender: { select: { id: true, institutionName: true, userId: true } } }
  });
  console.log('\n=== LEADS (' + leads.length + ') ===');
  leads.forEach(l => {
    let snap = {};
    try { snap = JSON.parse(l.vendorSnapshot || '{}'); } catch(e){}
    console.log(`LEAD ID: ${l.id} | Status: ${l.status} | VendorID: ${l.vendorId} | Lender: ${l.lender?.institutionName} (${l.lenderId})`);
    console.log(`  Snapshot -> Name: ${snap.vendorName || snap.name} | Email: ${snap.emailId || snap.email} | Phone: ${snap.mobileNumber || snap.phone} | Shop: ${snap.shopName}`);
  });
}

run().finally(() => prisma.$disconnect());
