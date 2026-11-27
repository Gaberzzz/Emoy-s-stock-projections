import { StyleSheet, Text, View } from 'react-native';
import type { CalcResult } from '../../calc/types';
import { BandChip } from '../../components/BandChip';
import { MoneyText } from '../../components/MoneyText';
import { ResultGrid } from '../../components/ResultGrid';
import { BAND_LABEL, PLAY_BANDS } from '../../domain/bandText';
import { formatMoney, formatPercent, formatPrice } from '../../format/format';
import { colors, space } from '../../theme';
import { BandLegend } from './BandLegend';

export function ToPlayTab({
  result,
  profitZoneThreshold,
}: {
  result: CalcResult;
  profitZoneThreshold: number;
}) {
  const grid = result.toPlay;
  const steps = grid.map((row) => row[0]?.step ?? 0);
  const tsrs = grid[0]?.map((c) => c.tsr) ?? [];
  return (
    <View>
      <Text style={styles.intro}>
        x = cash realized − net expense: what is left to play with after taking back 100% of your
        net expense (“house money” approach).
      </Text>
      <ResultGrid
        steps={steps}
        tsrs={tsrs}
        cellHeight={56}
        describeCell={(i, j) => {
          const c = grid[i]![j]!;
          return `${formatPercent(c.step)} sold at ${formatPrice(c.tsr)}: ${formatMoney(c.value.x)}, ${BAND_LABEL[c.value.band]}`;
        }}
        renderCell={(i, j) => {
          const { x, band } = grid[i]![j]!.value;
          return (
            <>
              <MoneyText value={x} signed style={styles.value} />
              <BandChip band={band} small />
            </>
          );
        }}
      />
      <BandLegend bands={PLAY_BANDS} profitZoneThreshold={profitZoneThreshold} />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, marginBottom: space.md, fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
});
