import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NumberField } from '../components/NumberField';
import { Button, Card, KeyValue, Row } from '../components/ui';
import {
  validateCapitalNote,
  validateName,
  validatePrice,
  validateProfitZoneThreshold,
  validateShares,
  validateSoldSteps,
  validateTargetSellRates,
} from '../calc/validate';
import { safeCalculate } from '../domain/helpers';
import { DEFAULT_SOLD_STEPS, type Lot } from '../domain/types';
import {
  formatMoney,
  formatPercent,
  formatPrice,
  formatShares,
  parseNumber,
} from '../format/format';
import type { ScreenProps } from '../navigation/types';
import { useActions, usePosition } from '../state/AppState';
import { colors, space } from '../theme';

/** Parses text and validates it; returns [value, error]. */
function check(
  text: string,
  validator: (n: number) => string | null,
): [number | null, string | null] {
  const n = parseNumber(text);
  if (n === null) return [null, 'Enter a number.'];
  const err = validator(n);
  return err ? [null, err] : [n, null];
}

function LotRow({
  index,
  lot,
  onChange,
  onRemove,
}: {
  index: number;
  lot: Lot;
  onChange: (lot: Lot) => string | null;
  onRemove: () => void;
}) {
  const [shares, setShares] = useState(String(lot.shares));
  const [price, setPrice] = useState(formatPrice(lot.averagePrice));
  const [errors, setErrors] = useState<{ shares?: string | null; price?: string | null }>({});

  const update = (nextShares: string, nextPrice: string, field: 'shares' | 'price') => {
    const [s, sErr] = check(nextShares, validateShares);
    const [p, pErr] = check(nextPrice, validatePrice);
    const fieldErr = field === 'shares' ? sErr : pErr;
    if (fieldErr) {
      setErrors((e) => ({ ...e, [field]: fieldErr }));
      return;
    }
    if (s !== null && p !== null) {
      const conflict = onChange({ ...lot, shares: s, averagePrice: p });
      setErrors((e) => ({ ...e, [field]: conflict }));
    } else {
      setErrors((e) => ({ ...e, [field]: null }));
    }
  };

  return (
    <View style={styles.lotRow}>
      <Row>
        <NumberField
          label={`Lot ${index + 1} shares`}
          value={shares}
          error={errors.shares}
          onChangeText={(t) => {
            setShares(t);
            update(t, price, 'shares');
          }}
        />
        <NumberField
          label={`Lot ${index + 1} average price`}
          value={price}
          error={errors.price}
          onChangeText={(t) => {
            setPrice(t);
            update(shares, t, 'price');
          }}
        />
      </Row>
      <Button
        title="Remove"
        kind="danger"
        accessibilityLabel={`Remove lot ${index + 1}`}
        onPress={onRemove}
      />
    </View>
  );
}

function ValueChip({
  label,
  onRemove,
  removeLabel,
}: {
  label: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        onPress={onRemove}
        hitSlop={10}
      >
        <Text style={styles.chipRemove}>×</Text>
      </Pressable>
    </View>
  );
}

export function PositionEditorScreen({ route, navigation }: ScreenProps<'PositionEditor'>) {
  const { positionId } = route.params;
  const position = usePosition(positionId);
  const actions = useActions();

  const [name, setName] = useState(position?.name ?? '');
  const [nameError, setNameError] = useState<string | null>(null);
  const [note, setNote] = useState(position?.capitalNote ?? '');
  const [noteError, setNoteError] = useState<string | null>(null);
  const [newShares, setNewShares] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newLotErrors, setNewLotErrors] = useState<{
    shares?: string | null;
    price?: string | null;
  }>({});
  const [newTsr, setNewTsr] = useState('');
  const [tsrError, setTsrError] = useState<string | null>(null);
  const [newStep, setNewStep] = useState('');
  const [stepError, setStepError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState(position ? String(position.profitZoneThreshold) : '');
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  const outcome = useMemo(() => (position ? safeCalculate(position) : null), [position]);

  if (!position) {
    return (
      <View style={styles.screen}>
        <Text>This position no longer exists.</Text>
      </View>
    );
  }

  const addLot = () => {
    const [s, sErr] = check(newShares, validateShares);
    const [p, pErr] = check(newPrice, validatePrice);
    setNewLotErrors({ shares: sErr, price: pErr });
    if (s === null || p === null) return;
    actions.addLot(position.id, s, p);
    setNewShares('');
    setNewPrice('');
  };

  const addTsr = () => {
    const n = parseNumber(newTsr);
    if (n === null) return setTsrError('Enter a number.');
    const next = [...position.targetSellRates, n];
    const err = validateTargetSellRates(next);
    setTsrError(err);
    if (err) return;
    actions.updatePosition(position.id, { targetSellRates: next });
    setNewTsr('');
  };

  const addStep = () => {
    const n = parseNumber(newStep);
    if (n === null) return setStepError('Enter a percentage, e.g. 30.');
    const next = [...position.soldSteps, Math.round(n * 100) / 10000];
    const err = validateSoldSteps(next);
    setStepError(err);
    if (err) return;
    actions.updatePosition(position.id, { soldSteps: next });
    setNewStep('');
  };

  const result = outcome?.result;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title="Position">
        <NumberField
          label="Name or ticker"
          keyboardType="default"
          value={name}
          error={nameError}
          onChangeText={(t) => {
            setName(t);
            const err = validateName(t);
            setNameError(err);
            if (!err) actions.updatePosition(position.id, { name: t });
          }}
        />
        <NumberField
          label="Capital note (optional)"
          keyboardType="default"
          placeholder="e.g. Capital: USD 677"
          value={note}
          error={noteError}
          onChangeText={(t) => {
            setNote(t);
            const err = validateCapitalNote(t);
            setNoteError(err);
            if (!err) actions.updatePosition(position.id, { capitalNote: t });
          }}
        />
      </Card>

      <Card title="Summary">
        {outcome?.error ? <Text style={styles.error}>{outcome.error}</Text> : null}
        <KeyValue label="Total shares (TS)">
          <Text style={styles.value} testID="summary-ts">
            {formatShares(result?.totalShares ?? 0)}
          </Text>
        </KeyValue>
        <KeyValue label="Net expense (NE)">
          <Text style={styles.value} testID="summary-ne">
            {formatMoney(result?.netExpense ?? 0)}
          </Text>
        </KeyValue>
        <KeyValue label="Weighted average price">
          <Text style={styles.value} testID="summary-ap">
            {result?.weightedAp != null
              ? formatPrice(Math.round(result.weightedAp * 10000) / 10000)
              : result?.status === 'HOUSE_MONEY'
                ? 'House money'
                : '—'}
          </Text>
        </KeyValue>
        <Button
          title="See analyses"
          onPress={() => navigation.navigate('Analyses', { positionId: position.id })}
        />
      </Card>

      <Card title="Lots (purchases)">
        {position.lots.length === 0 ? (
          <Text style={styles.muted}>No lots yet. Add the shares you bought below.</Text>
        ) : null}
        {position.lots.map((lot, i) => (
          <LotRow
            key={lot.id}
            index={i}
            lot={lot}
            onChange={(l) => actions.updateLot(position.id, l)}
            onRemove={() => {
              const err = actions.removeLot(position.id, lot.id);
              if (err) Alert.alert('Lot not removed', err);
            }}
          />
        ))}
        <Text style={styles.subhead}>Add a lot</Text>
        <Row>
          <NumberField
            label="New lot shares"
            value={newShares}
            error={newLotErrors.shares}
            onChangeText={setNewShares}
            placeholder="1000"
          />
          <NumberField
            label="New lot average price"
            value={newPrice}
            error={newLotErrors.price}
            onChangeText={setNewPrice}
            placeholder="1.80"
          />
        </Row>
        <Button title="Add lot" onPress={addLot} />
      </Card>

      <Card title="Target sell rates (TSR)">
        <View style={styles.chips}>
          {position.targetSellRates.map((t) => (
            <ValueChip
              key={t}
              label={formatPrice(t)}
              removeLabel={`Remove target sell rate ${formatPrice(t)}`}
              onRemove={() =>
                actions.updatePosition(position.id, {
                  targetSellRates: position.targetSellRates.filter((x) => x !== t),
                })
              }
            />
          ))}
        </View>
        <NumberField
          label="New target sell rate"
          value={newTsr}
          error={tsrError}
          onChangeText={(t) => {
            setNewTsr(t);
            setTsrError(null);
          }}
          onSubmitEditing={addTsr}
          placeholder="4.53"
        />
        <Button title="Add target sell rate" onPress={addTsr} />
      </Card>

      <Card title="% sold steps">
        <View style={styles.chips}>
          {position.soldSteps.map((s) => (
            <ValueChip
              key={s}
              label={formatPercent(s)}
              removeLabel={`Remove % sold step ${formatPercent(s)}`}
              onRemove={() =>
                actions.updatePosition(position.id, {
                  soldSteps: position.soldSteps.filter((x) => x !== s),
                })
              }
            />
          ))}
        </View>
        <NumberField
          label="New % sold step"
          value={newStep}
          error={stepError}
          onChangeText={(t) => {
            setNewStep(t);
            setStepError(null);
          }}
          onSubmitEditing={addStep}
          placeholder="90"
        />
        <Row>
          <Button title="Add % sold step" onPress={addStep} />
          <Button
            title="Reset to 10–80%"
            kind="secondary"
            onPress={() =>
              actions.updatePosition(position.id, { soldSteps: [...DEFAULT_SOLD_STEPS] })
            }
          />
        </Row>
      </Card>

      <Card title="To Play">
        <NumberField
          label="Profit Zone threshold (USD)"
          value={threshold}
          error={thresholdError}
          onChangeText={(t) => {
            setThreshold(t);
            const [n, err] = check(t, (v) => validateProfitZoneThreshold(v));
            setThresholdError(err);
            if (n !== null) actions.updatePosition(position.id, { profitZoneThreshold: n });
          }}
        />
        <Text style={styles.muted}>
          To Play values at or above this amount are shown as Profit Zone (350 in the workbook).
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  lotRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingBottom: space.sm,
    marginBottom: space.sm,
  },
  subhead: { fontWeight: '600', marginTop: space.sm, marginBottom: space.xs, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginBottom: space.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: space.md,
    paddingVertical: 6,
    backgroundColor: colors.card,
  },
  chipText: { fontSize: 15, color: colors.text },
  chipRemove: { fontSize: 18, color: colors.danger, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 13 },
  value: { fontSize: 15, fontWeight: '600', color: colors.text },
  error: { color: colors.danger, marginBottom: space.sm },
});
