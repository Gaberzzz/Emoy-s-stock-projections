import { StyleSheet, Text, View } from 'react-native';
import type { CalcResult } from '../../calc/types';
import { MoneyText } from '../../components/MoneyText';
import { ResultGrid } from '../../components/ResultGrid';
import { formatMoney, formatPercent, formatPrice } from '../../format/format';
import { colors, space } from '../../theme';

export function LiquidationTab({ result }: { result: CalcResult }) {
  const grid = result.liquidation;
  const steps = grid.map((row) => row[0]?.step ?? 0);
  const tsrs = grid[0]?.map((c) => c.tsr) ?? [];
  return (
    <View>
      <Text style={styles.intro}>
        Cash realized if you sell this % of your shares at each target sell rate (TS × p × TSR).
      </Text>
      <ResultGrid
        steps={steps}
        tsrs={tsrs}
        describeCell={(i, j) => {
          const c = grid[i]![j]!;
          return `${formatPercent(c.step)} sold at ${formatPrice(c.tsr)}: ${formatMoney(c.value)}`;
        }}
        renderCell={(i, j) => <MoneyText value={grid[i]![j]!.value} style={styles.value} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.muted, marginBottom: space.md, fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600' },
});
