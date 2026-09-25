import prisma from '../config/prisma';

/**
 * Permanently and atomically deletes a user and all related records across the database.
 * Used for in-app deletion, admin deletion, and GDPR/DPDPA 2023 compliance.
 */
export async function permanentlyDeleteUserById(targetId: string): Promise<{ success: boolean; message: string; email?: string }> {
  if (!targetId) {
    return { success: false, message: 'Target ID is required for deletion.' };
  }

  // 1. Identify the user record (either by User.id, VendorProfile.id/userId, or LenderProfile.id/userId)
  let user = await prisma.user.findUnique({
    where: { id: targetId },
  });

  if (!user) {
    const vendorProf = await prisma.vendorProfile.findFirst({
      where: { OR: [{ id: targetId }, { userId: targetId }] },
    });
    if (vendorProf) {
      user = await prisma.user.findUnique({ where: { id: vendorProf.userId } });
    }
  }

  if (!user) {
    const lenderProf = await prisma.lenderProfile.findFirst({
      where: { OR: [{ id: targetId }, { userId: targetId }] },
    });
    if (lenderProf) {
      user = await prisma.user.findUnique({ where: { id: lenderProf.userId } });
    }
  }

  if (!user) {
    return { success: false, message: 'Target user account not found or already removed.' };
  }

  const resolvedUserId = user.id;

  // 2. Perform atomic deletion of all relations and the user in a transaction
  await prisma.$transaction(async (tx) => {
    const vProfiles = await tx.vendorProfile.findMany({
      where: { userId: resolvedUserId },
      select: { id: true, businessName: true, ownerName: true },
    });
    const vIds = vProfiles.map((p) => p.id);

    const lProfiles = await tx.lenderProfile.findMany({
      where: { userId: resolvedUserId },
      select: { id: true, registrationNumber: true, institutionName: true },
    });
    const lIds = lProfiles.map((p) => p.id);
    const lRegs = lProfiles.map((p) => p.registrationNumber).filter(Boolean) as string[];
    const lNames = lProfiles.map((p) => p.institutionName).filter(Boolean) as string[];

    // 1. Delete all financing leads connected to this vendor or lender
    if (vIds.length > 0) {
      await tx.financingLead.deleteMany({ where: { vendorId: { in: vIds } } });
      await tx.fraudReport.deleteMany({ where: { vendorId: { in: vIds } } });
    }

    if (lIds.length > 0 || lRegs.length > 0 || lNames.length > 0) {
      await tx.financingLead.deleteMany({
        where: {
          OR: [
            ...(lIds.length > 0 ? [{ lenderId: { in: lIds } }] : []),
            ...(lRegs.length > 0 ? [{ lenderId: { in: lRegs } }] : []),
            ...(lNames.length > 0 ? [{ lenderId: { in: lNames } }] : []),
          ],
        },
      });
      if (lIds.length > 0) {
        await tx.fraudReport.deleteMany({ where: { lenderId: { in: lIds } } });
      }
    }

    // Clean up orphan leads that contain this user's phone or email in snapshot
    if (user.email || user.phone) {
      const remainingLeads = await tx.financingLead.findMany({ select: { id: true, vendorSnapshot: true } });
      const leadIdsToDelete = remainingLeads
        .filter((lead) => {
          if (!lead.vendorSnapshot) return false;
          return (
            (user.email && lead.vendorSnapshot.includes(user.email)) ||
            (user.phone && lead.vendorSnapshot.includes(user.phone))
          );
        })
        .map((l) => l.id);

      if (leadIdsToDelete.length > 0) {
        await tx.financingLead.deleteMany({ where: { id: { in: leadIdsToDelete } } });
      }
    }

    // 2. Explicitly delete wallet transactions and referrals
    await tx.walletTransaction.deleteMany({ where: { userId: resolvedUserId } });
    await tx.referralRecord.deleteMany({
      where: {
        OR: [{ referrerId: resolvedUserId }, { refereeId: resolvedUserId }],
      },
    });

    // 3. Delete user's payments
    await tx.payment.deleteMany({ where: { userId: resolvedUserId } });

    // 4. Delete user's subscriptions
    await tx.userSubscription.deleteMany({ where: { userId: resolvedUserId } });

    // 5. Delete KYC documents
    await tx.kYCDocument.deleteMany({ where: { userId: resolvedUserId } });

    // 6. Delete notifications
    await tx.notification.deleteMany({ where: { userId: resolvedUserId } });

    // 7. Delete support tickets
    await tx.supportTicket.deleteMany({ where: { userId: resolvedUserId } });

    // 8. Delete vendor profile if exists
    await tx.vendorProfile.deleteMany({ where: { userId: resolvedUserId } });

    // 9. Delete lender profile if exists
    await tx.lenderProfile.deleteMany({ where: { userId: resolvedUserId } });

    // 10. Delete the user record
    await tx.user.delete({ where: { id: resolvedUserId } });
  });

  return {
    success: true,
    message: `Account (${user.email || user.phone || resolvedUserId}) and all associated records permanently removed from database.`,
    email: user.email || undefined,
  };
}
