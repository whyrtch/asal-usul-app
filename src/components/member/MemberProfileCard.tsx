import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { UIText } from '@/components/ui/text';
import { AsalUsulColors, Spacing } from '@/constants/theme';
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

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(100)}>
      <Card variant="default" style={styles.card}>
        <CardContent style={styles.cardContent}>
          {/* Avatar + gender icon row */}
          <View style={styles.avatarRow}>
            <Avatar name={member.fullName} size={80} variant="default" />
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

          {/* Birth date */}
          <UIText variant="small" style={styles.birthDate}>
            {birthDateText}
          </UIText>
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
    marginBottom: Spacing.one,
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
  birthDate: {
    color: AsalUsulColors.textMuted,
  },
});
