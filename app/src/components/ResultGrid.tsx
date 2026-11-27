import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { formatPercent, formatPrice } from '../format/format';
import { colors, space } from '../theme';

interface Props {
  steps: number[];
  tsrs: number[];
  renderCell: (stepIndex: number, tsrIndex: number) => ReactNode;
  /** Accessible description of a cell, e.g. "30% sold at 6.53: 1,959.00". */
  describeCell: (stepIndex: number, tsrIndex: number) => string;
  cellHeight?: number;
}

const STEP_COL = 64;
const CELL_W = 112;

/**
 * % sold (rows) × TSR (columns). The % sold column stays fixed while the TSR columns scroll
 * horizontally, so each cell stays readable on a phone without zooming (SC-004).
 */
export function ResultGrid({ steps, tsrs, renderCell, describeCell, cellHeight = 44 }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={{ width: STEP_COL }}>
        <View style={[styles.header, { height: 36 }]}>
          <Text style={styles.headerText}>% sold</Text>
        </View>
        {steps.map((s) => (
          <View key={s} style={[styles.stepCell, { height: cellHeight }]}>
            <Text style={styles.stepText}>{formatPercent(s)}</Text>
          </View>
        ))}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.rowFlex}>
            {tsrs.map((t) => (
              <View key={t} style={[styles.header, { width: CELL_W, height: 36 }]}>
                <Text style={styles.headerText} accessibilityLabel={`Target sell rate ${t}`}>
                  @ {formatPrice(t)}
                </Text>
              </View>
            ))}
          </View>
          {steps.map((s, i) => (
            <View key={s} style={styles.rowFlex}>
              {tsrs.map((t, j) => (
                <View
                  key={t}
                  style={[styles.cell, { width: CELL_W, height: cellHeight }]}
                  accessible
                  accessibilityLabel={describeCell(i, j)}
                >
                  {renderCell(i, j)}
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', backgroundColor: colors.card, borderRadius: 8, overflow: 'hidden' },
  rowFlex: { flexDirection: 'row' },
  header: {
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    backgroundColor: '#EEF1F5',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  headerText: { fontWeight: '700', fontSize: 13, color: colors.text },
  stepCell: {
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#F6F7F9',
  },
  stepText: { fontWeight: '600', fontSize: 14, color: colors.text },
  cell: {
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 2,
  },
});
