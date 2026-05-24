import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
    type StyleProp,
    type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { AsalUsulColors, Radii, Shadows } from '@/constants/theme';

export interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outline';
  style?: StyleProp<ViewStyle>;
}

export function PrimaryButton({
  label,
  onPress,
  isLoading = false,
  disabled = false,
  variant = 'filled',
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || isLoading;
  const isFilled = variant === 'filled';

  function handlePress() {
    if (isDisabled) return;
    onPress();
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityState={{
        disabled: isDisabled,
        busy: isLoading,
      }}
      style={[
        styles.base,
        isFilled ? styles.filled : styles.outline,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          color={isFilled ? AsalUsulColors.textOnPrimary : AsalUsulColors.primary}
        />
      ) : (
        <ThemedText
          type="smallBold"
          style={isFilled ? styles.labelFilled : styles.labelOutline}
        >
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radii.pill,
    paddingVertical: 16,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  filled: {
    backgroundColor: AsalUsulColors.primary,
    borderColor: 'transparent',
    ...Shadows.button,
  },
  outline: {
    backgroundColor: 'transparent',
    borderColor: AsalUsulColors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  labelFilled: {
    color: AsalUsulColors.textOnPrimary,
  },
  labelOutline: {
    color: AsalUsulColors.primary,
  },
});
