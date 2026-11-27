import { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Disclaimer } from '../components/Disclaimer';
import { Banner, Button, Card, KeyValue, Row } from '../components/ui';
import { safeCalculate } from '../domain/helpers';
import { formatMoney, formatPrice, formatShares } from '../format/format';
import type { ScreenProps } from '../navigation/types';
import { usePosition } from '../state/AppState';
import { colors, space } from '../theme';
import { ClassificationTab } from './analyses/ClassificationTab';
import { LiquidationTab } from './analyses/LiquidationTab';
import { ProjectionTab } from './analyses/ProjectionTab';
import { ToPlayTab } from './analyses/ToPlayTab';

const TABS = ['Projection', 'Liquidation', 'Classification', 'To Play'] as const;
type Tab = (typeof TABS)[number];

export function AnalysesScreen({ route, navigation }: ScreenProps<'Analyses'>) {
  const { positionId, whatIf } = route.params;
  const position = usePosition(positionId);
  const [tab, setTab] = useState<Tab>('Projection');
  const outcome = useMemo(
    () => (position ? safeCalculate(position, whatIf) : null),
    [position, whatIf],
  );

  useLayoutEffect(() => {
    if (position)
      navigation.setOptions({ title: whatIf ? `${position.name} (preview)` : position.name });
  }, [navigation, position, whatIf]);

  if (!position || !outcome) {
    return (
      <View style={styles.screen}>
        <Text style={styles.pad}>This position no longer exists.</Text>
      </View>
    );
  }

  const toFormulas = () => navigation.navigate('FormulaInfo');
  const result = outcome.result;

  let body;
  if (!result) {
    body = <Banner>{outcome.error}</Banner>;
  } else if (result.status === 'EMPTY') {
    body = (
      <Card>
        <Text style={styles.text}>Add a lot to see the analyses.</Text>
        <Button
          title="Edit position"
          onPress={() => navigation.navigate('PositionEditor', { positionId })}
        />
      </Card>
    );
  } else if (result.status === 'FULLY_SOLD') {
    const realized = -result.netExpense;
    body = (
      <Card title="All shares sold">
        <KeyValue label="Total result (sales − cost)">{formatMoney(realized)}</KeyValue>
        <Text style={styles.text}>There are no shares left to project.</Text>
      </Card>
    );
  } else {
    body = (
      <>
        <View style={styles.tabs} accessibilityRole="tablist">
          {TABS.map((t) => (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityLabel={t}
              accessibilityState={{ selected: tab === t }}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && styles.tabActive]}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </Pressable>
          ))}
        </View>
        {tab === 'Projection' ? <ProjectionTab result={result} position={position} /> : null}
        {tab === 'Liquidation' ? <LiquidationTab result={result} /> : null}
        {tab === 'Classification' ? <ClassificationTab result={result} /> : null}
        {tab === 'To Play' ? (
          <ToPlayTab result={result} profitZoneThreshold={position.profitZoneThreshold} />
        ) : null}
      </>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {whatIf ? (
        <Banner>
          Preview — not saved. Includes a what-if sale of {formatShares(whatIf.shares)} shares @{' '}
          {formatPrice(whatIf.price)}.
        </Banner>
      ) : null}
      {position.capitalNote ? <Text style={styles.note}>{position.capitalNote}</Text> : null}
      {body}
      {!whatIf ? (
        <Row>
          <Button
            kind="secondary"
            title="Edit"
            onPress={() => navigation.navigate('PositionEditor', { positionId })}
          />
          <Button
            kind="secondary"
            title="Sales & what-if"
            onPress={() => navigation.navigate('Sales', { positionId })}
          />
        </Row>
      ) : null}
      <Disclaimer onPressFormulas={toFormulas} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  pad: { padding: space.lg },
  note: { color: colors.muted, marginBottom: space.sm },
  text: { color: colors.text, marginBottom: space.md, fontSize: 15 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#E6E9EE',
    borderRadius: 10,
    padding: 3,
    marginBottom: space.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    minHeight: 40,
    justifyContent: 'center',
  },
  tabActive: { backgroundColor: colors.card },
  tabText: { fontSize: 13, color: colors.muted, fontWeight: '600', textAlign: 'center' },
  tabTextActive: { color: colors.text },
});
