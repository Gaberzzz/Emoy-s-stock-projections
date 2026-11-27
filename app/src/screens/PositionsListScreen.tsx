import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { validateName } from '../calc/validate';
import { NumberField } from '../components/NumberField';
import { Banner, Button, Card, Row } from '../components/ui';
import { safeCalculate } from '../domain/helpers';
import type { Position } from '../domain/types';
import { formatMoney, formatShares } from '../format/format';
import type { ScreenProps } from '../navigation/types';
import { useActions, useAppState } from '../state/AppState';
import { colors, space } from '../theme';

function PositionRow({
  position,
  onOpen,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  position: Position;
  onOpen: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const r = safeCalculate(position).result;
  const summary = r
    ? `${formatShares(r.totalShares)} shares · NE ${formatMoney(r.netExpense)}`
    : 'Needs attention';
  return (
    <Card>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${position.name}`}
        onPress={onOpen}
      >
        <Text style={styles.name}>{position.name}</Text>
        {position.capitalNote ? <Text style={styles.muted}>{position.capitalNote}</Text> : null}
        <Text style={styles.summary}>{summary}</Text>
      </Pressable>
      <Row>
        <Button
          kind="secondary"
          title="Edit"
          accessibilityLabel={`Edit ${position.name}`}
          onPress={onEdit}
        />
        <Button
          kind="secondary"
          title="Duplicate"
          accessibilityLabel={`Duplicate ${position.name}`}
          onPress={onDuplicate}
        />
        <Button
          kind="danger"
          title="Delete"
          accessibilityLabel={`Delete ${position.name}`}
          onPress={onDelete}
        />
      </Row>
    </Card>
  );
}

export function PositionsListScreen({ navigation }: ScreenProps<'PositionsList'>) {
  const { data, recovered, saveFailed } = useAppState();
  const actions = useActions();
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const create = () => {
    const err = validateName(name);
    setNameError(err);
    if (err) return;
    const id = actions.addPosition(name);
    setName('');
    navigation.navigate('PositionEditor', { positionId: id });
  };

  const confirmDelete = (p: Position) =>
    Alert.alert(`Delete ${p.name}?`, 'Its lots, target sell rates and sales will be removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => actions.removePosition(p.id) },
    ]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {recovered ? (
        <Banner>
          Your saved data couldn’t be read, so the app started empty. A copy of the old data was
          kept on this phone.
        </Banner>
      ) : null}
      {saveFailed ? <Banner>Your latest changes could not be saved on this phone.</Banner> : null}

      {data.positions.length === 0 ? (
        <Card>
          <Text style={styles.text}>No positions yet.</Text>
          <Text style={styles.muted}>
            Create one below, or start from the example in Stocks-Projection.xlsx.
          </Text>
          <View style={{ height: space.sm }} />
          <Button
            kind="secondary"
            title="Add example (KEEL)"
            onPress={() => actions.addExample()}
          />
        </Card>
      ) : null}

      {data.positions.map((p) => (
        <PositionRow
          key={p.id}
          position={p}
          onOpen={() => navigation.navigate('Analyses', { positionId: p.id })}
          onEdit={() => navigation.navigate('PositionEditor', { positionId: p.id })}
          onDuplicate={() => actions.duplicatePosition(p.id)}
          onDelete={() => confirmDelete(p)}
        />
      ))}

      <Card title="New position">
        <NumberField
          label="New position name or ticker"
          keyboardType="default"
          placeholder="e.g. KEEL"
          value={name}
          error={nameError}
          onChangeText={(t) => {
            setName(t);
            setNameError(null);
          }}
          onSubmitEditing={create}
        />
        <Button title="Create position" onPress={create} />
      </Card>
      <Pressable onPress={() => navigation.navigate('FormulaInfo')} accessibilityRole="link">
        <Text style={styles.link}>How the numbers are calculated</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  name: { fontSize: 18, fontWeight: '700', color: colors.text },
  summary: { fontSize: 15, color: colors.text, marginVertical: space.sm },
  text: { fontSize: 16, color: colors.text, fontWeight: '600' },
  muted: { color: colors.muted, fontSize: 13 },
  link: { color: colors.primary, fontWeight: '600', textAlign: 'center', padding: space.md },
});
