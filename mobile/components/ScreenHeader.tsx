import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, font, space } from '@/constants/theme';

/**
 * Standard navigation header used by every (profile) sub-screen.
 * Back button on the left, centered title, optional right-slot
 * action (e.g. an Edit / Save / Add button).
 */
export function ScreenHeader({
  title,
  right,
}: {
  title: string;
  right?: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  return (
    <View style={[styles.header, { paddingTop: insets.top + space.sm }]}>
      <Pressable
        onPress={() => router.back()}
        style={styles.iconBtn}
        accessibilityLabel="Back"
        hitSlop={8}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightSlot}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: font.size.lg,
    color: colors.text,
    fontFamily: font.family.bold,
    fontWeight: font.weight.bold,
    textAlign: 'center',
    marginHorizontal: space.sm,
  },
  rightSlot: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
});
