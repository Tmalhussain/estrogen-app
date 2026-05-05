import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useTranslation } from '../../../i18n/useTranslation';
import { useAuthStore } from '../../../store';
import { useUserDb } from '../../../store/userDb';
import { showAlert } from '../../../utils/alert';

export default function PersonalInfoScreen() {
  const { user, updateUser } = useAuthStore();
  const { t, flexDir, align, isRTL } = useTranslation();
  const updateProfile = useUserDb((s) => s.updateProfile);
  const findByPhone = useUserDb((s) => s.findByPhone);

  // Pre-populate from auth store and userDb
  const dbUser = user?.phone ? findByPhone(user.phone) : undefined;

  const [form, setForm] = useState({
    firstName: dbUser?.firstName ?? user?.name?.split(' ')[0] ?? '',
    lastName: dbUser?.lastName ?? user?.name?.split(' ').slice(1).join(' ') ?? '',
    phone: user?.phone ?? '',
    email: dbUser?.email ?? user?.email ?? '',
    dateOfBirth: dbUser?.dateOfBirth ?? user?.dateOfBirth ?? '',
  });
  const [saving, setSaving] = useState(false);

  const userInitial = form.firstName.charAt(0) || (user?.name?.charAt(0) ?? '');

  const handleSave = () => {
    // Validate email if provided
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showAlert(t('error'), t('invalidEmail') || 'Invalid email address');
      return;
    }
    // Validate DOB format if provided
    if (form.dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth)) {
      showAlert(t('error'), t('invalidDateFormat') || 'Date format must be YYYY-MM-DD');
      return;
    }

    setSaving(true);

    // Update userDb with new profile data
    if (user?.phone) {
      updateProfile(user.phone, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        dateOfBirth: form.dateOfBirth,
      });
    }

    // Update auth store so the whole app sees the changes immediately
    updateUser({
      name: `${form.firstName} ${form.lastName}`,
      email: form.email,
      dateOfBirth: form.dateOfBirth,
    });

    setSaving(false);
    showAlert(t('saved'), t('savedMessage'), [
      { text: t('ok'), onPress: () => router.back() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { flexDirection: flexDir }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Icon name={isRTL ? 'forward' : 'back'} size={22} color={Colors.primaryDark} />
        </TouchableOpacity>
        <Text style={[styles.title, { textAlign: align }]}>{t('personalInfo')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>{userInitial}</Text>
          </View>
          <TouchableOpacity
            style={[styles.changePhotoBtn, { flexDirection: flexDir }]}
            onPress={() => showAlert(t('changePhoto'), t('comingSoon'))}
          >
            <Icon name="camera" size={15} color={Colors.primary} />
            <Text style={styles.changePhotoText}>{t('changePhoto')}</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={[styles.nameRow, { flexDirection: flexDir }]}>
          <View style={{ flex: 1 }}>
            <Input
              label={t('firstName')}
              value={form.firstName}
              onChangeText={(v) => setForm((f) => ({ ...f, firstName: v }))}
              placeholder={t('firstNamePlaceholder')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label={t('lastName')}
              value={form.lastName}
              onChangeText={(v) => setForm((f) => ({ ...f, lastName: v }))}
              placeholder={t('lastNamePlaceholder')}
            />
          </View>
        </View>

        <Input
          label={t('phone')}
          value={form.phone}
          onChangeText={(v) => setForm((f) => ({ ...f, phone: v }))}
          placeholder={t('phonePlaceholder')}
          keyboardType="phone-pad"
          editable={false}
        />

        <Input
          label={t('email')}
          value={form.email}
          onChangeText={(v) => setForm((f) => ({ ...f, email: v }))}
          placeholder={t('emailPlaceholder')}
          keyboardType="email-address"
        />

        <Input
          label={t('dateOfBirth')}
          value={form.dateOfBirth}
          onChangeText={(v) => setForm((f) => ({ ...f, dateOfBirth: v }))}
          placeholder={t('dateOfBirthPlaceholder')}
        />

        {/* PDPL Privacy Notice */}
        <View style={[styles.privacyCard, { flexDirection: flexDir }]}>
          <View style={styles.privacyIconWrap}>
            <Icon name="shield" size={18} color={Colors.primary} />
          </View>
          <Text style={[styles.privacyText, { textAlign: align }]}>
            {t('pdplNotice')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={styles.bottomBar}>
        <Button
          title={t('saveChanges')}
          onPress={handleSave}
          loading={saving}
          size="lg"
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarInitial: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.primary,
  },
  changePhotoBtn: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: Colors.overlayLight,
  },
  changePhotoText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  nameRow: {
    gap: 12,
  },
  privacyCard: {
    gap: 10,
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  privacyIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: Colors.primaryDark,
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    padding: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
});
