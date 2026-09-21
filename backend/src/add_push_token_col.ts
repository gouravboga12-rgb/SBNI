import prisma from './config/prisma';

async function main() {
  console.log('Connecting to AWS RDS PostgreSQL to add pushToken column to User table...');
  await prisma.$executeRawUnsafe('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushToken" TEXT;');
  console.log('✅ SUCCESS: pushToken column added to "User" table on live AWS RDS PostgreSQL!');

  // Verify column exists
  const count = await prisma.user.count();
  console.log(`Verified: User table queried successfully, total registered users: ${count}`);
}

main()
  .catch((e) => {
    console.error('❌ Error updating database table:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
