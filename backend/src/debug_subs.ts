import prisma from './config/prisma';

async function checkUserSubscriptions() {
  const user = await prisma.user.findUnique({
    where: { email: 'bogaravikumar680@gmail.com' },
    include: {
      subscriptions: { include: { plan: true } },
      payments: true,
      walletTransactions: true,
    },
  });
  console.log('USER bogaravikumar680 DETAILS:\n', JSON.stringify(user, null, 2));

  const allSubs = await prisma.userSubscription.findMany({
    include: { user: { select: { email: true } }, plan: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('LATEST 5 SUBSCRIPTIONS IN DB:\n', JSON.stringify(allSubs, null, 2));
}

checkUserSubscriptions()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
