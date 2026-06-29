import { type StyleProp, type ViewStyle } from 'react-native';

import { Button } from '@/components/ui/button';
import type { ButtonVariant } from '@/components/ui/button';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline';
  style?: StyleProp<ViewStyle>;
}

const VARIANT_MAP: Record<'filled' | 'outline', ButtonVariant> = {
  filled: 'default',
  outline: 'outline',
};

/**
 * PrimaryButton — convenience wrapper around the unified `Button` primitive.
 *
 * Maps the legacy `filled` / `outline` variants to `default` / `outline`
 * Button variants. All other props pass through directly.
 */
export function PrimaryButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'filled',
  style,
}: PrimaryButtonProps) {
  return (
    <Button
      label={label}
      onPress={onPress}
      isLoading={isLoading}
      disabled={disabled}
      variant={VARIANT_MAP[variant]}
      size="default"
      style={style}
    />
  );
}
