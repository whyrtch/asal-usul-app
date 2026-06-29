import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors, Radii, Spacing } from '@/constants/theme';
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
      <Card variant="default" style={styles.card}>
        <CardContent style={styles.cardContent}>
          {/* Avatar + gender icon row */}
          <View style={styles.avatarRow}>
            <MemberAvatar fullName={member.fullName} photoUrl={member.photoUrl} size={80} />
            <Text style={styles.genderIcon}>{genderIcon}</Text>
          </View>

          {/* Full name */}
          <UIText variant="h3" style={styles.fullName}>
            {member.fullName}
          </UIText>

          {/* Role badge */}
          <Badge variant="default" style={styles.roleBadge}>
            {member.role}
          </Badge>

          {/* Deceased badge — only when deceased */}
          {isDeceased && (
            <View style={styles.deceasedBadge}>
              <UIText variant="small" style={styles.deceasedText}>Almarhum/Almarhumah</UIText>
            </View>
          )}

          {/* Birth date */}
          <UIText variant="small" style={styles.birthDate}>
            Lahir: {birthDateText}
          </UIText>

          {/* Death date — only when deceased */}
          {isDeceased && (
            <UIText variant="small" style={styles.birthDate}>
              Meninggal: {deathDateText}
            </UIText>
          )}
        </CardContent>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    gap: Spacing.two,
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
    color: AsalUsulColors.textHeading,
    textAlign: 'center',
  },
  roleBadge: {
    alignSelf: 'center',
    marginBottom: 0,
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
    color: AsalUsulColors.textMuted,
  },
});
