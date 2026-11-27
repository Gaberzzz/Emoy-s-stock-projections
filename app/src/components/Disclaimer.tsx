import { StyleSheet, Text, View } from 'react-native';
import { CALC_VERSION } from '../calc/version';
import { colors, space } from '../theme';

export const DISCLAIMER_TEXT =
  'Informational what-if calculations, not financial advice. Past performance does not guarantee future results.';

/** Shown on every analysis screen (FR-012, constitution Principle II). */
export function Disclaimer({ onPressFormulas }: { onPressFormulas?: () => void }) {
  return (
    <View style={styles.wrap} testID="disclaimer">
      <Text style={styles.text}>{DISCLAIMER_TEXT}</Text>
      {onPressFormulas ? (
        <Text style={styles.link} accessibilityRole="link" onPress={onPressFormulas}>
          Formulas & version (v{CALC_VERSION})
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingVertical: space.md, gap: space.xs },
  text: { fontSize: 12, color: colors.muted },
  link: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});
