import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Icon } from '../../../components/ui/Icon';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { useTranslation } from '../../../i18n/useTranslation';
import { showAlert } from '../../../utils/alert';
import { useAddressesStore } from '../../../store/addressesStore';

const cityKeys = [
  'cityRiyadh',
  'cityJeddah',
  'cityMakkah',
  'cityMadinah',
  'cityDammam',
  'cityKhobar',
  'cityTabuk',
  'cityAbha',
] as const;

export default function AddressesScreen() {
  const { t, flexDir, align, isRTL } = useTranslation();
  const {
    addresses,
    initialized,
    initSeedData,
    addAddress,
    updateAddress,
    removeAddress,
    setDefault,
  } = useAddressesStore();

  useEffect(() => {
    if (!initialized) initSeedData();
  }, [initialized]);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '',
    city: 'cityRiyadh',
    district: '',
    street: '',
    buildingNo: '',
    floor: '',
    notes: '',
  });

  const handleSave = () => {
    if (!form.label || !form.district || !form.street) {
      showAlert(t('required'));
      return;
    }
    if (editingId) {
      updateAddress(editingId, form);
    } else {
      addAddress(form);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({
      label: '',
      city: 'cityRiyadh',
      district: '',
      street: '',
      buildingNo: '',
      floor: '',
      notes: '',
    });
  };

  const handleEdit = (addr: typeof addresses[0]) => {
    setForm({
      label: addr.label,
      city: addr.city,
      district: addr.district,
      street: addr.street,
      buildingNo: addr.buildingNo,
      floor: addr.floor,
      notes: addr.notes,
    });
    setEditingId(addr.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    showAlert(t('deleteAddress'), t('deleteAddressConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => removeAddress(id),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { flexDirection: flexDir }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Icon name={isRTL ? 'forward' : 'back'} size={22} color={Colors.primaryDark} />
        </TouchableOpacity>
        <Text style={[styles.title, { textAlign: align }]}>{t('myAddressesTitle')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {!showForm ? (
          <>
            {/* Address List */}
            {addresses.map((addr) => (
              <View
                key={addr.id}
                style={[styles.addrCard, addr.isDefault && styles.addrCardDefault]}
              >
                <View style={[styles.addrHeader, { flexDirection: flexDir }]}>
                  <View style={[styles.addrLabelRow, { flexDirection: flexDir }]}>
                    <View style={styles.addrIconWrap}>
                      <Icon name="mapPin" size={16} color={Colors.primary} />
                    </View>
                    <Text style={styles.addrLabel}>{addr.label}</Text>
                    {addr.isDefault && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>{t('defaultAddress')}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.addrActions}>
                    <TouchableOpacity
                      onPress={() => handleEdit(addr)}
                      style={styles.actionBtn}
                    >
                      <Icon name="edit" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDelete(addr.id)}
                      style={styles.actionBtn}
                    >
                      <Icon name="trash" size={14} color={Colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.addrDetail, { textAlign: align }]}>
                  {t(addr.city as any)}, {addr.district}
                </Text>
                <Text style={[styles.addrDetail, { textAlign: align }]}>
                  {addr.street}, {t('building')} {addr.buildingNo}
                </Text>
                {addr.notes ? (
                  <Text style={[styles.addrNotes, { textAlign: align }]}>
                    {addr.notes}
                  </Text>
                ) : null}

                {!addr.isDefault && (
                  <TouchableOpacity
                    style={[styles.setDefaultBtn, { alignSelf: isRTL ? 'flex-end' : 'flex-start' }]}
                    onPress={() => setDefault(addr.id)}
                  >
                    <Text style={styles.setDefaultText}>{t('setDefault')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Empty State */}
            {addresses.length === 0 && (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Icon name="mapPin" size={40} color={Colors.primarySoft} />
                </View>
                <Text style={styles.emptyTitle}>{t('noAddresses')}</Text>
                <Text style={styles.emptySubtext}>{t('noAddressesDesc')}</Text>
              </View>
            )}

            {/* Add Address Button */}
            <TouchableOpacity
              style={[styles.addBtn, { flexDirection: flexDir }]}
              onPress={() => setShowForm(true)}
              activeOpacity={0.7}
            >
              <Icon name="plus" size={18} color={Colors.primary} />
              <Text style={styles.addBtnText}>{t('addAddress')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Add/Edit Form */}
            <Text style={[styles.formTitle, { textAlign: align }]}>
              {editingId ? t('editAddress') : t('addAddress')}
            </Text>

            <Input
              label={t('addressName') + ' *'}
              value={form.label}
              onChangeText={(v) => setForm((f) => ({ ...f, label: v }))}
              placeholder={t('homeAddress')}
            />

            <Text style={[styles.inputLabel, { textAlign: align }]}>{t('city')} *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 16 }}
            >
              <View style={[{ gap: 8 }, { flexDirection: flexDir }]}>
                {cityKeys.map((key) => {
                  const isActive = form.city === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.cityChip, isActive && styles.cityChipActive]}
                      onPress={() => setForm((f) => ({ ...f, city: key }))}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.cityText, isActive && styles.cityTextActive]}>
                        {t(key as any)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <Input
              label={t('district') + ' *'}
              value={form.district}
              onChangeText={(v) => setForm((f) => ({ ...f, district: v }))}
              placeholder=""
            />
            <Input
              label={t('street') + ' *'}
              value={form.street}
              onChangeText={(v) => setForm((f) => ({ ...f, street: v }))}
              placeholder=""
            />

            <View style={[{ gap: 12 }, { flexDirection: flexDir }]}>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('building')}
                  value={form.buildingNo}
                  onChangeText={(v) => setForm((f) => ({ ...f, buildingNo: v }))}
                  placeholder=""
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label={t('floor')}
                  value={form.floor}
                  onChangeText={(v) => setForm((f) => ({ ...f, floor: v }))}
                  placeholder=""
                  keyboardType="numeric"
                />
              </View>
            </View>

            <Input
              label={t('notes')}
              value={form.notes}
              onChangeText={(v) => setForm((f) => ({ ...f, notes: v }))}
              placeholder=""
            />

            <View style={[{ gap: 12, marginTop: 8 }, { flexDirection: flexDir }]}>
              <Button
                title={t('save')}
                onPress={handleSave}
                size="lg"
                style={{ flex: 1 }}
              />
              <Button
                title={t('cancel')}
                onPress={resetForm}
                variant="outline"
                size="lg"
                style={{ flex: 1 }}
              />
            </View>
          </>
        )}
      </ScrollView>
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
    paddingBottom: 40,
  },
  addrCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  addrCardDefault: {
    borderColor: Colors.primary,
  },
  addrHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  addrLabelRow: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  addrIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  defaultBadge: {
    backgroundColor: Colors.overlayLight,
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  defaultBadgeText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  addrActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addrDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 2,
    lineHeight: 20,
  },
  addrNotes: {
    fontSize: 12,
    color: Colors.primary,
    marginTop: 6,
    fontStyle: 'italic',
  },
  setDefaultBtn: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.overlayLight,
  },
  setDefaultText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
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
  addBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    backgroundColor: Colors.overlayLight,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primaryDark,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  cityChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cityChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  cityText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  cityTextActive: {
    color: Colors.white,
  },
});
