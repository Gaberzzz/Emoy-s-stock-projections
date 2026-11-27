import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ClassBand, PlayBand } from '../../calc/types';
import { BandChip } from '../../components/BandChip';
import { bandRule } from '../../domain/bandText';
import { colors, space } from '../../theme';

/** Tappable legend: tapping a band shows its rule in plain language (US2 scenario 4). */
export function BandLegend({
  bands,
  profitZoneThreshold,
}: {
  bands: (ClassBand | PlayBand)[];
  profitZoneThreshold?: number;
}) {
  const [selected, setSelected] = useState<ClassBand | PlayBand | null>(null);
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Legend — tap a band for its rule</Text>
      <View style={styles.chips}>
        {bands.map((b) => (
          <BandChip key={b} band={b} onPress={() => setSelected((s) => (s === b ? null : b))} />
        ))}
      </View>
      {selected ? (
        <Text style={styles.rule} accessibilityLiveRegion="polite">
          {bandRule(selected, profitZoneThreshold)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: space.lg, gap: space.sm },
  title: { fontWeight: '600', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  rule: {
    color: colors.text,
    fontSize: 14,
    backgroundColor: colors.card,
    padding: space.md,
    borderRadius: 8,
  },
});
