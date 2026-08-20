import prisma from '../src/config/prisma';

async function run() {
  const lenderId = '9795d8f4-746e-4f60-905d-17b1eaeec71b';
  console.log('Testing deleteUser logic with ID:', lenderId);

  try {
    await prisma.user.delete({
      where: { id: lenderId },
    });
    console.log('Deleted directly via user.delete');
  } catch (e1: any) {
    console.log('user.delete failed as expected (not user.id):', e1.message);
    try {
      const v = await prisma.vendorProfile.findFirst({
        where: { OR: [{ id: lenderId }, { userId: lenderId }] },
      });
      if (v) {
        console.log('Found vendor profile:', v.id);
        await prisma.user.delete({ where: { id: v.userId } });
        console.log('Deleted vendor user');
        return;
      }

      const l = await prisma.lenderProfile.findFirst({
        where: { OR: [{ id: lenderId }, { userId: lenderId }] },
      });
      if (l) {
        console.log('Found lender profile:', l.id, 'userId:', l.userId);
        await prisma.user.delete({ where: { id: l.userId } });
        console.log('Successfully deleted lender user!');
        return;
      }
      console.log('Not found in vendor or lender profile');
    } catch (e2: any) {
      console.error('Error in fallback:', e2);
    }
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
