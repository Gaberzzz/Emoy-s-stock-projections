import { StyleSheet, Text, View } from 'react-native';
import type { CalcResult } from '../../calc/types';
import { BandChip } from '../../components/BandChip';
import { ResultGrid } from '../../components/ResultGrid';
import { Banner } from '../../components/ui';
import { BAND_LABEL, CLASS_BANDS } from '../../domain/bandText';
import { formatMultiple, formatPercent, formatPrice } from '../../format/format';
import { colors, space } from '../../theme';
import { BandLegend } from './BandLegend';

export const HOUSE_MONEY_TEXT =
  'Cost fully recovered — house money. Your sales have already paid back everything you put in, so the remaining shares cost you nothing and there is no multiple to show.';

export function ClassificationTab({ result }: { result: CalcResult }) {
  if (result.status === 'HOUSE_MONEY') {
    return (
      <View>
        <Banner>{HOUSE_MONEY_TEXT}</Banner>
        <BandLegend bands={CLASS_BANDS} />
      </View>
    );
  }
  const grid = result.classification;
  const steps = grid.map((row) => row[0]?.step ?? 0);
  const tsrs = grid[0]?.map((c) => c.tsr) ?? [];
  return (
    <View>
      <Text style={styles.intro}>
        M = p × TSR ÷ weighted average price: how many times your net expense this sale brings back.
      </Text>
      <ResultGrid
        steps={steps}
        tsrs={tsrs}
        cellHeight={74}
        describeCell={(i, j) => {
          const c = grid[i]![j]!;
          const { m, band } = c.value;
          return `${formatPercent(c.step)} sold at ${formatPrice(c.tsr)}: M ${m === null ? '—' : formatMultiple(m)}${band ? `, ${BAND_LABEL[band]}` : ''}`;
        }}
        renderCell={(i, j) => {
          const { m, band } = grid[i]![j]!.value;
          return (
            <>
              <Text style={styles.value}>{m === null ? '—' : formatMultiple(m)}</Text>
              {band ? <BandChip band={band} small /> : null}
            </>
          );
        }}
      />
      <BandLegend bands={CLASS_BANDS} />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, marginBottom: space.md, fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600', color: colors.text },
});
