/**
 * Firestore trigger: when a notification document is created,
 * fan it out to the user's registered FCM tokens as a push message.
 *
 * The notification doc is the source of truth (in-app inbox);
 * push is a best-effort delivery layer. Invalid tokens are pruned.
 */

import * as functions from 'firebase-functions';
import { db, messaging, FieldValue, REGION } from '../lib/admin';

interface NotificationDoc {
  userId: string;
  type: string;
  titleAr?: string;
  titleEn?: string;
  bodyAr?: string;
  bodyEn?: string;
  linkedOrderId?: string | null;
}

export const onNotificationCreated = functions
  .region(REGION)
  .firestore.document('notifications/{notificationId}')
  .onCreate(async (snap, context) => {
    const note = snap.data() as NotificationDoc;
    const notificationId = context.params.notificationId;

    const userSnap = await db.doc(`users/${note.userId}`).get();
    const user = userSnap.data();

    if (!user) {
      functions.logger.warn(`No user ${note.userId} for notification ${notificationId}`);
      return;
    }

    if (user.preferences?.notificationsEnabled === false) return;

    const tokens: string[] = Array.isArray(user.fcmTokens) ? user.fcmTokens : [];
    if (!tokens.length) return;

    const lang: 'ar' | 'en' = user.preferences?.language === 'en' ? 'en' : 'ar';
    const title = (lang === 'ar' ? note.titleAr : note.titleEn) || note.titleEn || note.titleAr || 'Estrogen Pharmacy';
    const body = (lang === 'ar' ? note.bodyAr : note.bodyEn) || note.bodyEn || note.bodyAr || '';

    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        notificationId,
        type: note.type ?? 'system',
        linkedOrderId: note.linkedOrderId ?? '',
      },
      android: {
        priority: 'high',
        notification: { channelId: 'default', sound: 'default' },
      },
      apns: {
        payload: {
          aps: { sound: 'default', badge: 1 },
        },
      },
    });

    // Prune tokens that are no longer valid
    const invalid: string[] = [];
    response.responses.forEach((res, idx) => {
      if (res.success) return;
      const code = res.error?.code;
      if (
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/registration-token-not-registered'
      ) {
        invalid.push(tokens[idx]);
      }
    });

    if (invalid.length) {
      await db.doc(`users/${note.userId}`).update({
        fcmTokens: FieldValue.arrayRemove(...invalid),
      });
      functions.logger.info(`Pruned ${invalid.length} invalid FCM tokens for ${note.userId}`);
    }

    functions.logger.info(
      `Push sent for ${notificationId}: ${response.successCount}/${tokens.length} delivered`
    );
  });
