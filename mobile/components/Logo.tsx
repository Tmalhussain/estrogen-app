import { Image } from 'expo-image';
import { StyleProp, ImageStyle } from 'react-native';

type Variant = 'full' | 'mark';

const sources = {
  full: require('@/assets/images/logo.png'),
  mark: require('@/assets/images/logo-mark.png'),
};

export function Logo({
  size = 56,
  variant = 'mark',
  style,
}: {
  size?: number;
  variant?: Variant;
  style?: StyleProp<ImageStyle>;
}) {
  return (
    <Image
      source={sources[variant]}
      style={[
        {
          width: variant === 'full' ? size * 1.05 : size,
          height: size,
        },
        style,
      ]}
      contentFit="contain"
      transition={120}
    />
  );
}
