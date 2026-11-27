import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { orderSales } from '../calc/sales';
import {
  validatePrice,
  validateSaleDate,
  validateSaleNote,
  validateShares,
} from '../calc/validate';
import { Disclaimer } from '../components/Disclaimer';
import { NumberField } from '../components/NumberField';
import { Banner, Button, Card, KeyValue, Row } from '../components/ui';
import { safeCalculate, todayIsoDate } from '../domain/helpers';
import type { WhatIfSale } from '../domain/types';
import { formatMoney, formatPrice, formatShares, parseNumber } from '../format/format';
import type { ScreenProps } from '../navigation/types';
import { useActions, usePosition } from '../state/AppState';
import { colors, space } from '../theme';
import type { CalcResult } from '../calc/types';

function apText(r: CalcResult | null): string {
  if (!r) return '—';
  if (r.status === 'HOUSE_MONEY') return 'House money';
  if (r.status === 'FULLY_SOLD') return 'All sold';
  return r.weightedAp === null ? '—' : formatPrice(Math.round(r.weightedAp * 10000) / 10000);
}

export function SalesScreen({ route, navigation }: ScreenProps<'Sales'>) {
  const { positionId } = route.params;
  const position = usePosition(positionId);
  const actions = useActions();

  const [shares, setShares] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayIsoDate());
  const [note, setNote] = useState('');
  const [recordError, setRecordError] = useState<string | null>(null);

  const current = useMemo(() => (position ? safeCalculate(position) : null), [position]);

  // Parse and validate the what-if form.
  const form = useMemo(() => {
    const s = parseNumber(shares);
    const p = parseNumber(price);
    const errors = {
      shares: shares === '' ? null : s === null ? 'Enter a number.' : validateShares(s),
      price: price === '' ? null : p === null ? 'Enter a number.' : validatePrice(p),
      date: validateSaleDate(date),
      note: validateSaleNote(note),
    };
    const complete =
      s !== null && p !== null && !errors.shares && !errors.price && !errors.date && !errors.note;
    const sale: WhatIfSale | null = complete
      ? { shares: s, price: p, date, ...(note.trim() ? { note: note.trim() } : {}) }
      : null;
    return { errors, sale };
  }, [shares, price, date, note]);

  const preview = useMemo(
    () => (position && form.sale ? safeCalculate(position, form.sale) : null),
    [position, form.sale],
  );

  if (!position || !current) {
    return (
      <View style={styles.screen}>
        <Text style={styles.pad}>This position no longer exists.</Text>
      </View>
    );
  }

  const record = () => {
    if (!form.sale || preview?.error) return;
    const err = actions.recordSale(position.id, form.sale);
    setRecordError(err);
    if (!err) {
      setShares('');
      setPrice('');
      setNote('');
    }
  };

  const confirmRemove = (saleId: string, label: string) =>
    Alert.alert('Remove this sale?', label, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => actions.removeSale(position.id, saleId),
      },
    ]);

  const after = preview?.result ?? null;
  const sales = orderSales(position.sales);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title="Current position">
        <KeyValue label="Total shares (TS)">
          <Text style={styles.value} testID="current-ts">
            {formatShares(current.result?.totalShares ?? 0)}
          </Text>
        </KeyValue>
        <KeyValue label="Net expense (NE)">
          <Text style={styles.value} testID="current-ne">
            {formatMoney(current.result?.netExpense ?? 0)}
          </Text>
        </KeyValue>
        <KeyValue label="Weighted average price">{apText(current.result)}</KeyValue>
      </Card>

      <Card title="What if I sell?">
        <Row>
          <NumberField
            label="Shares to sell"
            value={shares}
            onChangeText={(t) => {
              setShares(t);
              setRecordError(null);
            }}
            error={form.errors.shares}
          />
          <NumberField
            label="Sell price"
            value={price}
            onChangeText={(t) => {
              setPrice(t);
              setRecordError(null);
            }}
            error={form.errors.price}
          />
        </Row>
        <Row>
          <NumberField
            label="Date (YYYY-MM-DD)"
            keyboardType="numbers-and-punctuation"
            value={date}
            onChangeText={setDate}
            error={form.errors.date}
          />
          <NumberField
            label="Note (optional)"
            keyboardType="default"
            value={note}
            onChangeText={setNote}
            error={form.errors.note}
          />
        </Row>

        {preview?.error ? <Text style={styles.error}>{preview.error}</Text> : null}
        {recordError ? <Text style={styles.error}>{recordError}</Text> : null}

        {after ? (
          <View style={styles.preview}>
            <Text style={styles.subhead}>After this sale (not saved)</Text>
            <KeyValue label="Total shares (TS)">
              <Text style={styles.value} testID="after-ts">
                {formatShares(current.result?.totalShares ?? 0)} → {formatShares(after.totalShares)}
              </Text>
            </KeyValue>
            <KeyValue label="Net expense (NE)">
              <Text style={styles.value} testID="after-ne">
                {formatMoney(current.result?.netExpense ?? 0)} → {formatMoney(after.netExpense)}
              </Text>
            </KeyValue>
            <KeyValue label="Weighted average price">
              {`${apText(current.result)} → ${apText(after)}`}
            </KeyValue>
            {after.status === 'HOUSE_MONEY' ? (
              <Banner>Cost fully recovered — the remaining shares are house money.</Banner>
            ) : null}
          </View>
        ) : null}

        <View style={styles.actions}>
          <Button
            kind="secondary"
            title="Open analyses with this sale"
            disabled={!after}
            onPress={() =>
              form.sale && navigation.navigate('Analyses', { positionId, whatIf: form.sale })
            }
          />
          <Button title="Record this sale" disabled={!after} onPress={record} />
        </View>
      </Card>

      <Card title="Sales history">
        {sales.length === 0 ? <Text style={styles.muted}>No sales recorded yet.</Text> : null}
        {sales.map((s) => {
          const label = `${s.date}: ${formatShares(s.shares)} shares @ ${formatPrice(s.price)}`;
          return (
            <View key={s.id} style={styles.saleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.value}>{label}</Text>
                {s.note ? <Text style={styles.muted}>{s.note}</Text> : null}
              </View>
              <Button
                kind="danger"
                title="Remove"
                accessibilityLabel={`Remove sale ${label}`}
                onPress={() => confirmRemove(s.id, label)}
              />
            </View>
          );
        })}
      </Card>
      <Disclaimer onPressFormulas={() => navigation.navigate('FormulaInfo')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  pad: { padding: space.lg },
  value: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { color: colors.muted, fontSize: 13 },
  error: { color: colors.danger, marginBottom: space.sm },
  subhead: { fontWeight: '700', marginBottom: space.xs, color: colors.text },
  preview: { marginTop: space.sm, marginBottom: space.sm },
  actions: { gap: space.sm, marginTop: space.sm },
  saleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
