import { Pressable, StyleSheet, Text } from 'react-native';
import type { ClassBand, PlayBand } from '../calc/types';
import { BAND_LABEL } from '../domain/bandText';
import { bandColors } from '../theme';

interface Props {
  band: ClassBand | PlayBand;
  onPress?: () => void;
  small?: boolean;
}

/** A band label with its colour. The text label is always shown (never colour alone). */
export function BandChip({ band, onPress, small }: Props) {
  const c = bandColors[band];
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={BAND_LABEL[band]}
      accessibilityHint={onPress ? 'Shows the rule for this band' : undefined}
      style={[styles.chip, small && styles.small, { backgroundColor: c.bg }]}
    >
      <Text style={[styles.text, small && styles.smallText, { color: c.fg }]}>
        {BAND_LABEL[band]}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  small: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  text: { fontSize: 14, fontWeight: '600' },
  smallText: { fontSize: 11 },
});
