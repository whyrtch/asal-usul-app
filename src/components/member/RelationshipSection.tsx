import { AsalUsulColors, Radii, Shadows, Spacing } from '@/constants/theme';
import { Member } from '@/types/familyTree';
import { resolveRelationships } from '@/utils/validationUtils';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface RelationshipSectionProps {
  member: Member;
  allMembers: Member[];
}

interface RelationshipRowProps {
  label: string;
  members: Member[];
}

function RelationshipRow({ label, members }: RelationshipRowProps) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>
        {members.length === 0 ? (
          <Text style={styles.emptyText}>—</Text>
        ) : (
          members.map((m, index) => (
            <View key={m.id} style={styles.nameWrapper}>
              <Pressable
                onPress={() => router.push(`/member/${m.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Lihat profil ${m.fullName}`}
              >
                {({ pressed }) => (
                  <Text style={[styles.nameLink, pressed && styles.nameLinkPressed]}>
                    {m.fullName}
                  </Text>
                )}
              </Pressable>
              {index < members.length - 1 && (
                <Text style={styles.separator}>,{' '}</Text>
              )}
            </View>
          ))
        )}
      </View>
    </View>
  );
}

interface SingleRelationshipRowProps {
  label: string;
  member: Member | null;
}

function SingleRelationshipRow({ label, member }: SingleRelationshipRowProps) {
  const router = useRouter();

  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValue}>
        {member === null ? (
          <Text style={styles.emptyText}>—</Text>
        ) : (
          <Pressable
            onPress={() => router.push(`/member/${member.id}`)}
            accessibilityRole="button"
            accessibilityLabel={`Lihat profil ${member.fullName}`}
          >
            {({ pressed }) => (
              <Text style={[styles.nameLink, pressed && styles.nameLinkPressed]}>
                {member.fullName}
              </Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

export function RelationshipSection({ member, allMembers }: RelationshipSectionProps) {
  const { father, mother, spouses, children } = resolveRelationships(member, allMembers);

  return (
    <Animated.View entering={FadeInDown.duration(400).delay(200)}>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Hubungan Keluarga</Text>

        <SingleRelationshipRow label="Ayah" member={father} />
        <View style={styles.divider} />

        <SingleRelationshipRow label="Ibu" member={mother} />
        <View style={styles.divider} />

        <RelationshipRow label="Pasangan" members={spouses} />
        <View style={styles.divider} />

        <RelationshipRow label="Anak" members={children} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AsalUsulColors.backgroundCard,
    borderRadius: Radii.lg,
    padding: Spacing.four,
    ...Shadows.card,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AsalUsulColors.textHeading,
    marginBottom: Spacing.three,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.two,
    minHeight: 36,
  },
  rowLabel: {
    fontSize: 14,
    color: AsalUsulColors.textMuted,
    fontWeight: '500',
    width: 72,
    paddingTop: 2,
  },
  rowValue: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  nameWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameLink: {
    fontSize: 14,
    color: AsalUsulColors.primaryLight,
    fontWeight: '500',
  },
  nameLinkPressed: {
    opacity: 0.6,
  },
  separator: {
    fontSize: 14,
    color: AsalUsulColors.textBody,
  },
  emptyText: {
    fontSize: 14,
    color: AsalUsulColors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: AsalUsulColors.borderSubtle,
    marginVertical: Spacing.one,
  },
});
