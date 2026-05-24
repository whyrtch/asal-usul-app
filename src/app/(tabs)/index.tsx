/**
 * HomeScreen — Displays authenticated user's profile info.
 * Requirements: 4.1, 4.4, 4.6, 4.7
 */

import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useTheme } from '@/hooks/use-theme';

/** Size of the profile photo / avatar placeholder in dp. */
const AVATAR_SIZE = 80;

export default function HomeScreen() {
  const { user } = useAuth();
  const theme = useTheme();

  // Requirements 4.6: displayName if non-null, email as fallback
  const displayLabel = user?.displayName ?? user?.email ?? null;

  // Requirements 4.7: show photo if photoURL is non-null, else placeholder
  const hasPhoto = user?.photoURL != null;

  // Derive initials for the avatar placeholder (first letter of displayName or email)
  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* ── Profile section ──────────────────────────────────────────── */}
        <View style={styles.profileSection}>
          {/* Profile photo or avatar placeholder — Requirements: 4.7 */}
          {hasPhoto ? (
            <Image
              testID="profile-image"
              source={{ uri: user!.photoURL! }}
              style={styles.avatar}
              contentFit="cover"
              accessibilityLabel="Profile photo"
              accessibilityRole="image"
            />
          ) : (
            <View
              testID="avatar-placeholder"
              style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.backgroundElement }]}
              accessibilityLabel="Avatar placeholder"
              accessibilityRole="image"
            >
              <ThemedText type="subtitle" style={styles.avatarInitial}>
                {initial}
              </ThemedText>
            </View>
          )}

          {/* User name / email — Requirements: 4.6 */}
          {displayLabel !== null && (
            <ThemedText
              testID="user-name"
              type="subtitle"
              style={styles.userName}
            >
              {displayLabel}
            </ThemedText>
          )}
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    flexDirection: 'row',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    maxWidth: MaxContentWidth,
  },
  profileSection: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    lineHeight: AVATAR_SIZE,
    textAlign: 'center',
  },
  userName: {
    textAlign: 'center',
  },
});
