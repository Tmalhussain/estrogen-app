import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { colors, font, radius, space } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export function CategoryTile({
  icon,
  label,
  href,
}: {
  icon: IoniconName;
  label: string;
  href: string;
}) {
  return (
    <Link href={href as never} asChild>
      <Pressable style={({ pressed }) => [styles.tile, pressed && { opacity: 0.85 }]}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={28} color={colors.primary} />
        </View>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: 84,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    marginTop: space.sm,
    fontSize: font.size.xs,
    color: colors.text,
    fontWeight: font.weight.semi,
    textAlign: 'center',
  },
});
