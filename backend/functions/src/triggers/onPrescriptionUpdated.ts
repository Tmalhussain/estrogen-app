/**
 * Firestore trigger for prescription status updates.
 *
 * When a pharmacist approves, rejects, or holds a prescription,
 * the user is notified and the linked order status is updated.
 */

import * as functions from 'firebase-functions';
import { db, FieldValue, REGION } from '../lib/admin';

export const onPrescriptionUpdated = functions
  .region(REGION)
  .firestore.document('prescriptions/{prescriptionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const prescriptionId = context.params.prescriptionId;

    if (before.status === after.status) return;

    const newStatus = after.status;
    const userId = after.userId;

    let notification: {
      titleAr: string;
      titleEn: string;
      bodyAr: string;
      bodyEn: string;
    };

    switch (newStatus) {
      case 'approved':
        notification = {
          titleAr: 'تمت الموافقة على وصفتكِ',
          titleEn: 'Prescription Approved',
          bodyAr: 'تمت مراجعة وصفتكِ الطبية والموافقة عليها. جاري تجهيز طلبكِ.',
          bodyEn: 'Your prescription has been reviewed and approved. We are preparing your order.',
        };
        if (after.linkedOrderId) {
          await db.doc(`orders/${after.linkedOrderId}`).update({
            status: 'approved',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;

      case 'rejected':
        notification = {
          titleAr: 'تم رفض الوصفة الطبية',
          titleEn: 'Prescription Rejected',
          bodyAr: `تم رفض وصفتكِ الطبية. ${after.pharmacistNotes ? `السبب: ${after.pharmacistNotes}` : 'يرجى التواصل مع الدعم.'}`,
          bodyEn: `Your prescription was rejected. ${after.pharmacistNotes ? `Reason: ${after.pharmacistNotes}` : 'Please contact support.'}`,
        };
        if (after.linkedOrderId) {
          await db.doc(`orders/${after.linkedOrderId}`).update({
            status: 'cancelled',
            cancellationReason: 'prescription_rejected',
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        break;

      case 'hold':
        notification = {
          titleAr: 'مطلوب معلومات إضافية',
          titleEn: 'Additional Information Required',
          bodyAr: 'الصيدلانية تحتاج معلومات إضافية عن وصفتكِ. يرجى مراجعة الطلب.',
          bodyEn: 'The pharmacist needs additional information about your prescription. Please review.',
        };
        break;

      default:
        functions.logger.info(`Prescription ${prescriptionId} status changed to ${newStatus}, no notification sent.`);
        return;
    }

    await db.collection('notifications').add({
      userId,
      type: 'order',
      ...notification,
      read: false,
      linkedOrderId: after.linkedOrderId || null,
      timestamp: FieldValue.serverTimestamp(),
    });

    functions.logger.info(`Prescription ${prescriptionId}: ${before.status} → ${newStatus} for user ${userId}`);
  });
