import { StyleSheet, Text } from 'react-native';

import { AsalUsulColors } from '@/constants/theme';

export interface SectionTitleProps {
  title: string;
}

export function SectionTitle({ title }: SectionTitleProps) {
  return <Text style={styles.title}>{title}</Text>;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: AsalUsulColors.textMuted,
  },
});
