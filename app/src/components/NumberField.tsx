import { StyleSheet, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { colors, space } from '../theme';

interface Props {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string | null;
  placeholder?: string;
  /** Defaults to a decimal keypad; use "default" for text fields. */
  keyboardType?: KeyboardTypeOptions;
  testID?: string;
  onSubmitEditing?: () => void;
}

/** A labelled input with an inline error message. */
export function NumberField({
  label,
  value,
  onChangeText,
  error,
  placeholder,
  keyboardType = 'decimal-pad',
  testID,
  onSubmitEditing,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmitEditing}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={keyboardType}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minWidth: 100, marginBottom: space.sm },
  label: { fontSize: 13, color: colors.muted, marginBottom: 2 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: space.sm,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: colors.card,
    color: colors.text,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, marginTop: 2 },
});
