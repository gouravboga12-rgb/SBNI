import axios from 'axios';
import prisma from '../config/prisma';
import { calculateDistanceKm } from '../utils/distance';
import { emitToUser } from './socketService';

export interface ExpoPushMessage {
  to: string;
  sound?: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
  channelId?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Save / Update a user's Expo push token in the database
 */
export async function saveUserPushToken(userId: string, pushToken: string): Promise<boolean> {
  try {
    if (!userId || !pushToken) return false;

    // Validate token format (must start with ExponentPushToken[ or ExpoPushToken[)
    const trimmed = pushToken.trim();
    if (!trimmed.startsWith('ExponentPushToken') && !trimmed.startsWith('ExpoPushToken')) {
      console.warn(`[PushNotification] Invalid Expo push token format: ${trimmed}`);
      return false;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { pushToken: trimmed },
    });

    console.log(`📱 [PushNotification] Registered push token for user ${userId}`);
    return true;
  } catch (error: any) {
    console.error(`❌ [PushNotification] Error saving push token for user ${userId}:`, error.message);
    return false;
  }
}

/**
 * Batch send push notifications to a list of Expo push tokens
 */
export async function sendExpoPushNotification(
  pushTokens: string[],
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<number> {
  try {
    // Filter valid, unique tokens
    const validTokens = Array.from(
      new Set(
        pushTokens.filter(
          (t) =>
            t &&
            typeof t === 'string' &&
            (t.startsWith('ExponentPushToken') || t.startsWith('ExpoPushToken'))
        )
      )
    );

    if (validTokens.length === 0) {
      return 0;
    }

    const messages: ExpoPushMessage[] = validTokens.map((to) => ({
      to,
      sound: 'default',
      title,
      body,
      data: data || {},
      priority: 'high',
      channelId: 'default',
    }));

    // Expo accepts up to 100 messages per HTTP request
    const CHUNK_SIZE = 100;
    let sentCount = 0;

    for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
      const chunk = messages.slice(i, i + CHUNK_SIZE);
      try {
        const response = await axios.post(EXPO_PUSH_URL, chunk, {
          headers: {
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        if (response.data?.data) {
          sentCount += chunk.length;
        }
      } catch (chunkErr: any) {
        console.error('❌ [PushNotification] Expo API Chunk Send Error:', chunkErr.response?.data || chunkErr.message);
      }
    }

    console.log(`🚀 [PushNotification] Successfully dispatched ${sentCount} Expo push notifications.`);
    return sentCount;
  } catch (err: any) {
    console.error('❌ [PushNotification] Send Push Notification Error:', err.message);
    return 0;
  }
}

/**
 * CORE REQUIREMENT:
 * Send push notifications to all Vendor accounts within the newly registered / updated Lender's radius
 * (e.g. 50 km or 70 km as configured on the lender account)
 */
export async function notifyVendorsOfNewLender(lender: {
  id: string;
  userId?: string;
  institutionName: string;
  city?: string | null;
  state?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lendingRadiusKm?: number | null;
  minLoanAmount?: number | null;
  maxLoanAmount?: number | null;
}): Promise<{ notifiedCount: number; vendorsMatched: number }> {
  try {
    const lenderLat = lender.latitude ?? 19.0760;
    const lenderLng = lender.longitude ?? 72.8777;
    const lenderRadius = lender.lendingRadiusKm && lender.lendingRadiusKm > 0 ? lender.lendingRadiusKm : 50.0;
    const financerName = lender.institutionName || 'A new Financer partner';
    const locationLabel = lender.city ? `${lender.city}` : 'your area';

    console.log(
      `📍 [PushNotification] Evaluating vendors within ${lenderRadius} km of Lender "${financerName}" (${lenderLat}, ${lenderLng})`
    );

    // Fetch all active Vendor profiles and their linked User account
    const vendors = await prisma.vendorProfile.findMany({
      where: {
        kycStatus: { not: 'REJECTED' },
        user: {
          isDeleted: false,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            pushToken: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!vendors || vendors.length === 0) {
      console.log('ℹ️ [PushNotification] No registered vendor accounts found in database.');
      return { notifiedCount: 0, vendorsMatched: 0 };
    }

    const matchedVendors: Array<{
      vendorId: string;
      userId: string;
      pushToken?: string | null;
      businessName: string;
      distanceKm: number;
    }> = [];

    for (const v of vendors) {
      const vLat = v.latitude ?? 19.0760;
      const vLng = v.longitude ?? 72.8777;
      const distance = calculateDistanceKm(lenderLat, lenderLng, vLat, vLng);

      if (distance <= lenderRadius) {
        matchedVendors.push({
          vendorId: v.id,
          userId: v.userId,
          pushToken: v.user?.pushToken,
          businessName: v.businessName,
          distanceKm: distance,
        });
      }
    }

    console.log(
      `🎯 [PushNotification] Found ${matchedVendors.length} vendor(s) within ${lenderRadius} km radius.`
    );

    if (matchedVendors.length === 0) {
      return { notifiedCount: 0, vendorsMatched: 0 };
    }

    const pushTokensToSend: string[] = [];
    const notificationTitle = 'New Financer in Your Area! 💰';

    // 1. Create In-App Notification & emit real-time Socket event for each matched vendor
    for (const matched of matchedVendors) {
      const distanceText = matched.distanceKm <= 1 ? 'less than 1 km' : `${Math.round(matched.distanceKm)} km`;
      const notificationMessage = `${financerName} has just joined JustPaisa within ${distanceText} of your shop (${locationLabel}). Connect directly for business loans & working capital!`;

      try {
        await prisma.notification.create({
          data: {
            userId: matched.userId,
            title: notificationTitle,
            message: notificationMessage,
            channel: 'PUSH',
            type: 'LENDER_ALERT',
          },
        });
      } catch (dbErr: any) {
        console.warn(`[PushNotification] Could not insert DB notification for user ${matched.userId}:`, dbErr.message);
      }

      // Real-time socket event to active browser/app session
      emitToUser(matched.userId, 'new_lender_in_radius', {
        lenderId: lender.id,
        institutionName: financerName,
        distanceKm: Math.round(matched.distanceKm),
        city: lender.city,
        title: notificationTitle,
        message: notificationMessage,
        createdAt: new Date().toISOString(),
      });

      emitToUser(matched.userId, 'notification', {
        title: notificationTitle,
        message: notificationMessage,
        type: 'LENDER_ALERT',
        createdAt: new Date().toISOString(),
      });

      if (matched.pushToken) {
        pushTokensToSend.push(matched.pushToken);
      }
    }

    // 2. Dispatch Expo Mobile Push Notifications to all device tokens
    let pushedCount = 0;
    if (pushTokensToSend.length > 0) {
      const commonBody = `${financerName} has joined JustPaisa within ${lenderRadius} km of your shop. Tap to view loan offers!`;
      pushedCount = await sendExpoPushNotification(
        pushTokensToSend,
        notificationTitle,
        commonBody,
        {
          type: 'NEW_LENDER_ALERT',
          lenderId: lender.id,
          lenderName: financerName,
          radiusKm: lenderRadius,
        }
      );
    }

    return {
      notifiedCount: matchedVendors.length,
      vendorsMatched: matchedVendors.length,
    };
  } catch (error: any) {
    console.error('❌ [PushNotification] notifyVendorsOfNewLender error:', error.message);
    return { notifiedCount: 0, vendorsMatched: 0 };
  }
}
