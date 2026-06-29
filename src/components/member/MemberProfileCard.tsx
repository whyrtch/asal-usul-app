import { MemberAvatar } from '@/components/ui/member-avatar';
import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface MemberProfileCardProps {
  member: Member;
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
  const genderIcon = member.gender === 'male' ? '♂' : '♀';
  const birthDateText = formatBirthDate(member.birthDate);
  const isDeceased = member.status === 'deceased';
  const deathDateText = isDeceased ? formatBirthDate(member.deathDate) : null;

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
      <View style={styles.card}>
        {/* Avatar + gender icon row */}
        <View style={styles.avatarRow}>
          <MemberAvatar fullName={member.fullName} photoUrl={member.photoUrl} size={80} />
          <Text style={styles.genderIcon}>{genderIcon}</Text>
        </View>

        {/* Full name */}
        <Text style={styles.fullName}>{member.fullName}</Text>

        {/* Role badge */}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{member.role}</Text>
        </View>

        {/* Deceased badge */}
        {isDeceased && (
          <View style={styles.deceasedBadge}>
            <Text style={styles.deceasedText}>Almarhum/Almarhumah</Text>
          </View>
        )}

        {/* Birth date */}
        <Text style={styles.birthDate}>Lahir: {birthDateText}</Text>

        {/* Death date — only when deceased */}
        {isDeceased && (
          <Text style={styles.birthDate}>Meninggal: {deathDateText}</Text>
        )}
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
  deceasedBadge: {
    borderRadius: Radii.pill,
    backgroundColor: AsalUsulColors.backgroundOverlay,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginBottom: Spacing.two,
  },
  deceasedText: {
    fontSize: 12,
    color: AsalUsulColors.textMuted,
    fontWeight: '600',
  },
  birthDate: {
    fontSize: 14,
    color: AsalUsulColors.textMuted,
  },
});
