import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, space } from '../theme';

export function Button({
  title,
  onPress,
  kind = 'primary',
  disabled,
  accessibilityLabel,
}: {
  title: string;
  onPress: () => void;
  kind?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        kind === 'primary' && styles.primary,
        kind === 'secondary' && styles.secondary,
        kind === 'danger' && styles.dangerBtn,
        (pressed || disabled) && { opacity: 0.6 },
      ]}
    >
      <Text
        style={[
          styles.btnText,
          kind === 'primary' ? { color: colors.primaryText } : { color: colors.primary },
          kind === 'danger' && { color: colors.danger },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

export function Card({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <View style={styles.card}>
      {title ? (
        <Text style={styles.cardTitle} accessibilityRole="header">
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

export function Row({ children }: { children: ReactNode }) {
  return <View style={styles.row}>{children}</View>;
}

export function KeyValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.kv}>
      <Text style={styles.kvLabel}>{label}</Text>
      {typeof children === 'string' ? <Text style={styles.kvValue}>{children}</Text> : children}
    </View>
  );
}

export function Banner({ children }: { children: ReactNode }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.bannerText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: space.md,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card },
  dangerBtn: { borderWidth: 1, borderColor: colors.danger, backgroundColor: colors.card },
  btnText: { fontSize: 15, fontWeight: '600' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: space.lg,
    marginBottom: space.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', marginBottom: space.sm, color: colors.text },
  row: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start', flexWrap: 'wrap' },
  kv: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  kvLabel: { color: colors.muted, fontSize: 15 },
  kvValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
  banner: {
    backgroundColor: colors.banner,
    padding: space.md,
    borderRadius: 8,
    marginBottom: space.md,
  },
  bannerText: { color: colors.text, fontSize: 14 },
});
