import Constants from 'expo-constants';
import { StyleSheet, Text } from 'react-native';

import { AsalUsulColors } from '@/constants/theme';

const version = Constants.expoConfig?.version ?? '1.0.0';

export function VersionInfo() {
  return <Text style={styles.version}>Version {version}</Text>;
}

const styles = StyleSheet.create({
  version: {
    fontSize: 15,
    fontWeight: '500',
    color: AsalUsulColors.textBody,
  },
});
