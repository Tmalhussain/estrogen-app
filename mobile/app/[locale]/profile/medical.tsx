import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../../constants/colors';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { Button } from '../../../components/ui/Button';
import { useTranslation } from '../../../i18n/useTranslation';
import { useProfileStore } from '../../../store';
import { showAlert } from '../../../utils/alert';

interface PregnancyOption {
  id: 'not_pregnant' | 'pregnant' | 'breastfeeding' | 'planning';
  labelKey: 'notPregnant' | 'pregnant' | 'breastfeeding' | 'planningPregnancy';
  icon: IconName;
}

const pregnancyOptions: PregnancyOption[] = [
  { id: 'not_pregnant', labelKey: 'notPregnant', icon: 'user' },
  { id: 'pregnant', labelKey: 'pregnant', icon: 'pregnancy' },
  { id: 'breastfeeding', labelKey: 'breastfeeding', icon: 'babyBottle' },
  { id: 'planning', labelKey: 'planningPregnancy', icon: 'calendarHeart' },
];

const allergyKeys = [
  'allergyPenicillin',
  'allergySulfa',
  'allergyAspirin',
  'allergyIbuprofen',
  'allergyCodeine',
  'allergyNSAIDs',
  'allergyAmoxicillin',
  'allergyOther',
] as const;

const conditionKeys = [
  'conditionThyroid',
  'conditionHypertension',
  'conditionDiabetes',
  'conditionAsthma',
  'conditionAnemia',
  'conditionPCOS',
  'conditionEndometriosis',
  'conditionOther',
] as const;

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function MedicalProfileScreen() {
  const { t, flexDir, align, isRTL } = useTranslation();
  const { medical, setMedical } = useProfileStore();

  const [pregnancyStatus, setPregnancyStatus] = useState(medical.pregnancyStatus);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(medical.allergies);
  const [selectedConditions, setSelectedConditions] = useState<string[]>(medical.conditions);
  const [bloodType, setBloodType] = useState<string | null>(medical.bloodType);

  const toggleAllergy = (key: string) => {
    setSelectedAllergies((prev) =>
      prev.includes(key) ? prev.filter((a) => a !== key) : [...prev, key]
    );
  };

  const toggleCondition = (key: string) => {
    setSelectedConditions((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleSave = () => {
    setMedical({
      pregnancyStatus,
      bloodType,
      allergies: selectedAllergies,
      conditions: selectedConditions,
    });
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
        <Text style={[styles.title, { textAlign: align }]}>{t('myMedicalProfile')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Privacy Banner */}
        <View style={[styles.privacyBanner, { flexDirection: flexDir }]}>
          <View style={styles.privacyIconWrap}>
            <Icon name="shield" size={18} color={Colors.primary} />
          </View>
          <Text style={[styles.privacyText, { textAlign: align }]}>
            {t('medicalPrivacy')}
          </Text>
        </View>

        {/* Pregnancy Status */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <Icon name="pregnancy" size={20} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { textAlign: align }]}>
              {t('pregnancyStatus')}
            </Text>
          </View>
          <View style={[styles.optionsGrid, { flexDirection: flexDir }]}>
            {pregnancyOptions.map((opt) => {
              const isActive = pregnancyStatus === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.optionCard, isActive && styles.optionCardActive]}
                  onPress={() => setPregnancyStatus(opt.id)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.optionIconWrap,
                      { backgroundColor: isActive ? Colors.primary : Colors.primarySoft },
                    ]}
                  >
                    <Icon
                      name={opt.icon}
                      size={22}
                      color={isActive ? Colors.white : Colors.primary}
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionLabel,
                      isActive && styles.optionLabelActive,
                      { textAlign: 'center' },
                    ]}
                  >
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Blood Type */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <Icon name="bloodDrop" size={20} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { textAlign: align }]}>
              {t('bloodType')}
            </Text>
          </View>
          <View style={[styles.bloodGrid, { flexDirection: flexDir }]}>
            {bloodTypes.map((bt) => {
              const isActive = bloodType === bt;
              return (
                <TouchableOpacity
                  key={bt}
                  style={[styles.bloodChip, isActive && styles.bloodChipActive]}
                  onPress={() => setBloodType(bloodType === bt ? null : bt)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.bloodText, isActive && styles.bloodTextActive]}>
                    {bt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Allergies */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <Icon name="alertTriangle" size={20} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { textAlign: align }]}>
              {t('allergies')}
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { textAlign: align }]}>
            {t('selectApplicable')}
          </Text>
          <View style={[styles.chipGrid, { flexDirection: flexDir }]}>
            {allergyKeys.map((key) => {
              const isActive = selectedAllergies.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => toggleAllergy(key)}
                  activeOpacity={0.7}
                >
                  {isActive && <Icon name="check" size={14} color={Colors.white} />}
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {t(key as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Chronic Conditions */}
        <View style={styles.section}>
          <View style={[styles.sectionHeader, { flexDirection: flexDir }]}>
            <Icon name="heartPulse" size={20} color={Colors.primary} />
            <Text style={[styles.sectionTitle, { textAlign: align }]}>
              {t('chronicConditions')}
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { textAlign: align }]}>
            {t('selectApplicable')}
          </Text>
          <View style={[styles.chipGrid, { flexDirection: flexDir }]}>
            {conditionKeys.map((key) => {
              const isActive = selectedConditions.includes(key);
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => toggleCondition(key)}
                  activeOpacity={0.7}
                >
                  {isActive && <Icon name="check" size={14} color={Colors.white} />}
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {t(key as any)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Info Note */}
        <View style={[styles.infoCard, { flexDirection: flexDir }]}>
          <View style={styles.infoIconWrap}>
            <Icon name="info" size={16} color={Colors.info} />
          </View>
          <Text style={[styles.infoText, { textAlign: align }]}>
            {t('medicalNote')}
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Save Button */}
      <View style={styles.bottomBar}>
        <Button title={t('saveChanges')} onPress={handleSave} size="lg" style={{ flex: 1 }} />
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
  privacyBanner: {
    gap: 10,
    backgroundColor: Colors.primarySoft,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
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
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  optionsGrid: {
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  optionCard: {
    flexBasis: '47%',
    flexGrow: 1,
    minWidth: 0,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.overlayLight,
  },
  optionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  optionLabelActive: {
    color: Colors.primaryDark,
    fontWeight: '700',
  },
  bloodGrid: {
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
  },
  bloodChip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  bloodChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bloodText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  bloodTextActive: {
    color: Colors.white,
  },
  chipGrid: {
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  chipTextActive: {
    color: Colors.white,
  },
  infoCard: {
    gap: 10,
    backgroundColor: Colors.infoLight,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    alignItems: 'flex-start',
  },
  infoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.info,
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
