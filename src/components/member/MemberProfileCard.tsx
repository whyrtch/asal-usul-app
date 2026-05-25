import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface MemberProfileCardProps {
  member: Member;
}

function getInitials(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  const first = words[0]?.[0] ?? '';
  const second = words[1]?.[0] ?? '';
  return (first + second).toUpperCase();
}

function formatBirthDate(birthDate: string | null): string {
  if (!birthDate) return 'Tidak diketahui';
  try {
    const date = new Date(birthDate);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return 'Tidak diketahui';
  }
}

export function MemberProfileCard({ member }: MemberProfileCardProps) {
  const initials = getInitials(member.fullName);
  const genderIcon = member.gender === 'male' ? '♂' : '♀';
  const birthDateText = formatBirthDate(member.birthDate);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
      <View style={styles.card}>
        {/* Avatar + gender icon row */}
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.genderIcon}>{genderIcon}</Text>
        </View>

        {/* Full name */}
        <Text style={styles.fullName}>{member.fullName}</Text>

        {/* Role badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{member.role}</Text>
        </View>

        {/* Birth date */}
        <Text style={styles.birthDate}>{birthDateText}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    padding: Spacing.four,
    alignItems: 'center',
    ...Shadows.card,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.three,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AsalUsulColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  genderIcon: {
    fontSize: 22,
    color: AsalUsulColors.primaryMuted,
    marginLeft: Spacing.two,
    marginBottom: Spacing.one,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: AsalUsulColors.textHeading,
    textAlign: 'center',
    marginBottom: Spacing.two,
  },
  roleBadge: {
    borderRadius: Radii.pill,
    backgroundColor: AsalUsulColors.backgroundOverlay,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginBottom: Spacing.two,
  },
  roleText: {
    fontSize: 13,
    color: AsalUsulColors.textBody,
    fontWeight: '500',
  },
  birthDate: {
    fontSize: 14,
    color: AsalUsulColors.textMuted,
  },
});
