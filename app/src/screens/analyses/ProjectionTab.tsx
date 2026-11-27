import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { CalcResult } from '../../calc/types';
import { MoneyText } from '../../components/MoneyText';
import { Button, Card, KeyValue } from '../../components/ui';
import type { Position } from '../../domain/types';
import { formatMoney, formatPrice, formatShares } from '../../format/format';
import { colors, space } from '../../theme';

export function ProjectionTab({ result, position }: { result: CalcResult; position: Position }) {
  const [perLot, setPerLot] = useState(false);
  return (
    <View>
      <Card title="Summary">
        <KeyValue label="Total shares (TS)">{formatShares(result.totalShares)}</KeyValue>
        <KeyValue label="Net expense (NE)">{formatMoney(result.netExpense)}</KeyValue>
        <KeyValue label="Weighted average price">
          {result.weightedAp === null
            ? 'House money'
            : formatPrice(Math.round(result.weightedAp * 10000) / 10000)}
        </KeyValue>
      </Card>

      {result.projection.length === 0 ? (
        <Text style={styles.muted}>Add a target sell rate to see projections.</Text>
      ) : null}

      {result.projection.map((row) => (
        <Card key={row.tsr} title={`If all sold @ ${formatPrice(row.tsr)}`}>
          <KeyValue label="Gross profit (GP)">
            <MoneyText value={row.grossProfit} style={styles.value} />
          </KeyValue>
          <KeyValue label="Net profit (NP)">
            <MoneyText value={row.netProfit} signed style={styles.value} />
          </KeyValue>
          <KeyValue label="Rate diff vs. average (RD)">
            {row.rateDiffPosition === null ? (
              '—'
            ) : (
              <MoneyText value={row.rateDiffPosition} signed style={styles.value} />
            )}
          </KeyValue>
          {perLot
            ? row.rateDiffPerLot.map((rd, i) => (
                <KeyValue
                  key={position.lots[i]?.id ?? i}
                  label={`  Lot ${i + 1} (@ ${formatPrice(position.lots[i]?.averagePrice ?? 0)})`}
                >
                  <MoneyText value={rd} signed style={styles.value} />
                </KeyValue>
              ))
            : null}
        </Card>
      ))}

      {result.projection.length > 0 && position.lots.length > 1 ? (
        <Button
          kind="secondary"
          title={perLot ? 'Hide rate diff per lot' : 'Show rate diff per lot'}
          onPress={() => setPerLot((v) => !v)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  value: { fontSize: 15, fontWeight: '600' },
  muted: { color: colors.muted, marginBottom: space.md },
});
