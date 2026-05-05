/**
 * Auth trigger: when a new user signs up via Firebase Auth,
 * create their Firestore profile, set the default 'user' role
 * as a custom claim, and send a welcome notification.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';
import { setUserRoleClaim } from '../lib/customClaims';

export const onUserCreated = functions
  .region(REGION)
  .auth.user()
  .onCreate(async (user) => {
    const { uid, email, phoneNumber, displayName } = user;

    const nameParts = (displayName || '').split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const profileData = {
      firstName,
      lastName,
      phone: phoneNumber || '',
      email: email || '',
      nationalId: '',
      dateOfBirth: '',
      role: 'user' as const,
      medical: {
        pregnancyStatus: 'not_pregnant',
        bloodType: null,
        allergies: [],
        conditions: [],
      },
      preferences: {
        language: 'ar',
        notificationsEnabled: true,
        discreetPackaging: true,
      },
      fcmTokens: [],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    await db.doc(`users/${uid}`).set(profileData);
    await setUserRoleClaim(uid, 'user');

    await db.collection('notifications').add({
      userId: uid,
      type: 'system',
      titleAr: 'أهلاً بكِ في إستروجين',
      titleEn: 'Welcome to Estrogen Pharmacy',
      bodyAr: 'مرحباً بكِ في صيدلية إستروجين. نتمنى لكِ تجربة صحية مميزة.',
      bodyEn: 'Welcome to Estrogen Pharmacy. We wish you a wonderful health journey.',
      read: false,
      timestamp: FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Created profile for user ${uid}`, { uid, email, phoneNumber });
  });
