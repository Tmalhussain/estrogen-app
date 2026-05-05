import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { useTranslation } from '../../../i18n/useTranslation';
import { Badge } from '../../../components/ui/Badge';
import { usePrescriptionsStore } from '../../../store/prescriptionsStore';
import { useNotificationsStore } from '../../../store/notificationsStore';
import { showAlert } from '../../../utils/alert';

const statusBadgeType: Record<string, 'success' | 'warning' | 'danger' | 'info'> = {
  pending_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  expired: 'danger',
};

export default function PrescriptionsScreen() {
  const prescriptions = usePrescriptionsStore((s) => s.prescriptions);
  const addPrescription = usePrescriptionsStore((s) => s.addPrescription);
  const addNotification = useNotificationsStore((s) => s.addNotification);
  const { t, tn, isRTL, flexDir, align } = useTranslation();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled) {
      const uri = result.assets[0]?.uri ?? null;
      const fileName = `prescription_${Date.now()}.jpg`;
      addPrescription(fileName, uri);
      addNotification({
        type: 'order',
        titleAr: 'تم رفع الوصفة الطبية',
        titleEn: 'Prescription Uploaded',
        bodyAr: 'تم رفع وصفتكِ الطبية بنجاح. سيتم مراجعتها قريباً.',
        bodyEn: 'Your prescription has been uploaded successfully. It will be reviewed shortly.',
      });
      showAlert(t('uploadSuccess'), t('uploadSuccess'));
    }
  };

  const takePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert(t('permissionRequired'), t('permissionRequired'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.9 });
    if (!result.canceled) {
      const uri = result.assets[0]?.uri ?? null;
      const fileName = `prescription_${Date.now()}.jpg`;
      addPrescription(fileName, uri);
      addNotification({
        type: 'order',
        titleAr: 'تم رفع الوصفة الطبية',
        titleEn: 'Prescription Uploaded',
        bodyAr: 'تم رفع وصفتكِ الطبية بنجاح. سيتم مراجعتها قريباً.',
        bodyEn: 'Your prescription has been uploaded successfully. It will be reviewed shortly.',
      });
      showAlert(t('uploadSuccess'), t('uploadSuccess'));
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { textAlign: align }]}>{t('myPrescriptions')}</Text>
      </View>

      {/* ── Upload Card ──────────────────────────────── */}
      <View style={styles.uploadCard}>
        <View style={styles.uploadIconWrap}>
          <Icon name="upload" size={28} color={Colors.primary} />
        </View>
        <Text style={[styles.uploadTitle, { textAlign: align }]}>{t('uploadPrescription')}</Text>
        <View style={[styles.uploadBtns, { flexDirection: flexDir }]}>
          <TouchableOpacity
            style={[styles.uploadBtn, { flexDirection: flexDir }]}
            onPress={takePicture}
            activeOpacity={0.7}
          >
            <Icon name="camera" size={18} color={Colors.primary} />
            <Text numberOfLines={1} style={styles.uploadBtnText}>{t('takePhoto')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.uploadBtn, { flexDirection: flexDir }]}
            onPress={pickImage}
            activeOpacity={0.7}
          >
            <Icon name="folder" size={18} color={Colors.primary} />
            <Text numberOfLines={1} style={styles.uploadBtnText}>{t('fromFiles')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Info Banner ──────────────────────────────── */}
      <View style={[styles.infoBanner, { flexDirection: flexDir }]}>
        <Icon name="info" size={16} color={Colors.info} />
        <Text style={[styles.infoText, { textAlign: align }]}>{t('prescriptionTips')}</Text>
      </View>

      {/* ── Prescriptions List ───────────────────────── */}
      <FlatList
        data={prescriptions}
        keyExtractor={p => p.id}
        contentContainerStyle={{ padding: 20, gap: 10 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="file" size={36} color={Colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { textAlign: align }]}>{t('noPrescriptions')}</Text>
            <Text style={[styles.emptySubtext, { textAlign: 'center' }]}>{t('noPrescriptionsDesc')}</Text>
          </View>
        }
        renderItem={({ item: rx }) => (
          <TouchableOpacity style={[styles.rxCard, { flexDirection: flexDir }]} activeOpacity={0.8}>
            <View style={styles.rxIconWrap}>
              <Icon name="fileText" size={24} color={Colors.primary} />
            </View>
            <View style={styles.rxInfo}>
              <Text style={[styles.rxFileName, { textAlign: align }]} numberOfLines={1}>
                {rx.fileName}
              </Text>
              <Text style={[styles.rxDate, { textAlign: align }]}>
                {t('uploadedOn')} {rx.date}
              </Text>
              {rx.linkedOrder && (
                <Text style={[styles.rxLinked, { textAlign: align }]}>
                  {t('linkedTo')} {rx.linkedOrder}
                </Text>
              )}
              <Badge
                label={tn('prescriptionStatus', rx.status)}
                type={statusBadgeType[rx.status] ?? 'info'}
                small
              />
            </View>
            <Icon
              name={isRTL ? 'chevronLeft' : 'chevronRight'}
              size={18}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  // Upload Card
  uploadCard: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.primaryLight,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 16,
  },
  uploadBtns: {
    gap: 12,
    width: '100%',
  },
  uploadBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    minWidth: 0,
  },
  uploadBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    flexShrink: 1,
  },
  // Info Banner
  infoBanner: {
    marginHorizontal: 20,
    marginBottom: 8,
    backgroundColor: Colors.infoLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.info,
    lineHeight: 18,
  },
  // Empty
  empty: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  // Rx Card
  rxCard: {
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  rxIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rxInfo: {
    flex: 1,
    gap: 4,
  },
  rxFileName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  rxDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  rxLinked: {
    fontSize: 11,
    color: Colors.primary,
  },
});
