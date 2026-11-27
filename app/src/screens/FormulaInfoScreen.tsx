import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CALC_VERSION } from '../calc/version';
import { BandChip } from '../components/BandChip';
import { DISCLAIMER_TEXT } from '../components/Disclaimer';
import { Card } from '../components/ui';
import { CLASS_BANDS, PLAY_BANDS, bandRule } from '../domain/bandText';
import { colors, space } from '../theme';

const FORMULAS: [string, string][] = [
  ['Total shares', 'TS = Σ shares bought − Σ shares sold'],
  ['Net expense', 'NE = Σ shares × average price − Σ shares sold × sell price'],
  ['Weighted average price', 'AP = NE ÷ TS (all lots, after sales)'],
  ['Gross profit', 'GP = TS × TSR'],
  ['Net profit', 'NP = GP − NE'],
  ['Rate diff', 'RD = TSR − AP'],
  ['Realized (Liquidation)', 'Realized = TS × p × TSR, where p is the % sold'],
  ['Multiple (Classification)', 'M = p × TSR ÷ AP'],
  ['To Play', 'x = Realized − NE'],
  ['Recorded sale', 'TS′ = TS − shares sold; NE′ = NE − shares sold × sell price'],
];

export function FormulaInfoScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card title="Formulas">
        {FORMULAS.map(([name, f]) => (
          <View key={name} style={styles.formula}>
            <Text style={styles.name}>{name}</Text>
            <Text style={styles.text}>{f}</Text>
          </View>
        ))}
        <Text style={styles.muted}>
          Money is shown to 2 decimals. Bands are decided on the value as shown (rounded to 2
          decimals), so the label always matches the number.
        </Text>
      </Card>
      <Card title="Classification bands">
        {CLASS_BANDS.map((b) => (
          <View key={b} style={styles.formula}>
            <BandChip band={b} />
            <Text style={styles.text}>{bandRule(b)}</Text>
          </View>
        ))}
      </Card>
      <Card title="To Play bands">
        {PLAY_BANDS.map((b) => (
          <View key={b} style={styles.formula}>
            <BandChip band={b} />
            <Text style={styles.text}>{bandRule(b)}</Text>
          </View>
        ))}
        <Text style={styles.muted}>
          The Profit Zone threshold (350 by default) can be changed for each position.
        </Text>
      </Card>
      <Card title="About">
        <Text style={styles.text}>Calculation version {CALC_VERSION}</Text>
        <Text style={styles.text}>
          Based on Stocks-Projection.xlsx. All data stays on this phone; the app makes no network
          requests.
        </Text>
        <Text style={styles.muted}>{DISCLAIMER_TEXT}</Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.lg },
  formula: { marginBottom: space.md, gap: space.xs },
  name: { fontWeight: '700', color: colors.text },
  text: { color: colors.text, fontSize: 15 },
  muted: { color: colors.muted, fontSize: 13, marginTop: space.sm },
});
