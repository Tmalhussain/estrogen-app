import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useTranslation } from '../../i18n/useTranslation';
import { useNotificationsStore, type AppNotification } from '../../store/notificationsStore';

const typeConfig: Record<string, { icon: IconName; color: string; bg: string }> = {
  order: { icon: 'package', color: Colors.accent, bg: Colors.accentLight },
  promo: { icon: 'tag', color: Colors.warning, bg: Colors.warningLight },
  health: { icon: 'heartPulse', color: Colors.danger, bg: Colors.dangerLight },
  system: { icon: 'bell', color: Colors.textSecondary, bg: Colors.surfaceSecondary },
};

function formatTimeAgo(timestamp: number, t: (key: any) => string): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return t('timeJustNow');
  if (minutes < 60) return `${minutes} ${t('timeMinutes')}`;
  if (hours < 24) return `${hours} ${t('timeHours')}`;
  if (days === 1) return t('timeYesterday');
  return `${days} ${t('timeDays')}`;
}

export default function NotificationsScreen() {
  const { t, localize, flexDir, align, isRTL } = useTranslation();
  const notifications = useNotificationsStore((s) => s.notifications);
  const markAsRead = useNotificationsStore((s) => s.markAsRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const unreadCount = useNotificationsStore((s) => s.notifications.filter(n => !n.read).length);

  const renderNotification = ({ item }: { item: AppNotification }) => {
    const config = typeConfig[item.type] ?? typeConfig.system;
    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.notifCardUnread]}
        onPress={() => markAsRead(item.id)}
        activeOpacity={0.85}
      >
        <View style={[styles.notifRow, { flexDirection: flexDir }]}>
          <View style={[styles.notifIconWrap, { backgroundColor: config.bg }]}>
            <Icon name={config.icon} size={20} color={config.color} />
          </View>
          <View style={styles.notifContent}>
            <View style={[styles.notifHeader, { flexDirection: flexDir }]}>
              {!item.read && <View style={styles.unreadDot} />}
              <Text style={[styles.notifTitle, { textAlign: align }]} numberOfLines={1}>
                {localize(item.titleAr, item.titleEn)}
              </Text>
            </View>
            <Text style={[styles.notifBody, { textAlign: align }]} numberOfLines={2}>
              {localize(item.bodyAr, item.bodyEn)}
            </Text>
            <Text style={[styles.notifTime, { textAlign: align }]}>
              {formatTimeAgo(item.timestamp, t)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={[styles.topBar, { flexDirection: flexDir }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <Icon name={isRTL ? 'forward' : 'back'} size={22} color={Colors.primaryDark} />
        </TouchableOpacity>
        <Text
          numberOfLines={1}
          style={[styles.title, { flex: 1, textAlign: 'center', marginHorizontal: 8 }]}
        >
          {t('notificationsTitle')}
        </Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>{t('markAllRead')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderNotification}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Icon name="bell" size={40} color={Colors.primarySoft} />
            </View>
            <Text style={styles.emptyTitle}>{t('noNotifications')}</Text>
            <Text style={styles.emptySubtext}>{t('noNotificationsDesc')}</Text>
          </View>
        }
      />
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
  markAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  notifCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  notifCardUnread: {
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.primaryMuted,
  },
  notifRow: {
    gap: 12,
  },
  notifIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  notifHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    flex: 1,
  },
  notifBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textTertiary,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
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
});
