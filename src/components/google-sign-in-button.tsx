import { AntDesign } from '@expo/vector-icons';
import {
    ActivityIndicator,
    Pressable,
    StyleSheet,
} from 'react-native';

import { UIText } from '@/components/ui/text';
import { AsalUsulColors, ButtonHeight, Radii, Shadows } from '@/constants/theme';

export interface GoogleSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  testID?: string;
}

const DEFAULT_LABEL = 'Masuk dengan Google';

export function GoogleSignInButton({
  onPress,
  isLoading = false,
  disabled = false,
  label,
  testID,
}: GoogleSignInButtonProps) {
  const resolvedLabel = label ?? DEFAULT_LABEL;
  const isDisabled = disabled || isLoading;

  function handlePress() {
    if (isDisabled) return;
    onPress();
  }

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={resolvedLabel}
      accessibilityState={{
        disabled: isDisabled,
        busy: isLoading,
      }}
      style={({ pressed }) => [
        styles.button,
        pressed && !isDisabled && styles.pressed,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator
          color={AsalUsulColors.textOnPrimary}
          testID="activity-indicator"
        />
      ) : (
        <>
          <AntDesign name="google" size={20} color={AsalUsulColors.textOnPrimary} style={styles.icon} />
          <UIText variant="smallBold" style={styles.label}>
            {resolvedLabel}
          </UIText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AsalUsulColors.primary,
    borderRadius: Radii.pill,
    paddingVertical: 16,
    minHeight: ButtonHeight.default,
    ...Shadows.button,
  },
  pressed: {
    opacity: 0.85,
  },
  icon: {
    marginRight: 8,
  },
  label: {
    color: AsalUsulColors.textOnPrimary,
  },
});
